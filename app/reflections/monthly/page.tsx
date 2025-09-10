'use client'

import { useEffect, useState } from 'react'
import { getAuth } from 'firebase/auth'
import { subDays, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { getEntryCountForLastDays } from '@/lib/firestore/entries'
import { fetchAutoReflection, saveReflection } from '@/lib/firestore/reflections'
import { Timestamp } from 'firebase/firestore'

type AutoReflection = {
  summary: string
  rangeStart: Timestamp
  rangeEnd: Timestamp
  isComplete: boolean
}

export default function MonthlyReflectionsPage() {
  const [autoReflection, setAutoReflection] = useState<AutoReflection | null>(null)
  const [manualReflection, setManualReflection] = useState<string | null>(null)
  const [entryCount, setEntryCount] = useState<number>(0)
  const [canGenerate, setCanGenerate] = useState(false)
  const [isComplete, setIsComplete] = useState(true)

  useEffect(() => {
    async function loadPageData() {
      const auth = getAuth()
      const user = auth.currentUser
      const token = await user?.getIdToken()

      const thisMonthStart = startOfMonth(new Date())
      const thisMonthEnd = endOfMonth(new Date())

      // 1. Try to fetch auto-reflection
      const auto = await fetchAutoReflection('monthly')

      // Validate that the reflection matches this month
      if (
        auto &&
        isWithinInterval(auto.rangeStart.toDate(), { start: thisMonthStart, end: thisMonthEnd }) &&
        isWithinInterval(auto.rangeEnd.toDate(), { start: thisMonthStart, end: thisMonthEnd })
      ) {
        setAutoReflection(auto)
      } else if (token) {
        // 2. Trigger auto-generation if it doesn't exist or isn't current
        try {
          const response = await fetch('/api/auto-generate-reflection', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ type: 'monthly' }),
          })

          const data = await response.json()

          if (response.ok && data.summary) {
            setAutoReflection({
              summary: data.summary,
              rangeStart: Timestamp.fromDate(thisMonthStart),
              rangeEnd: Timestamp.fromDate(thisMonthEnd),
              isComplete: true,
            })
          } else {
            console.warn('Auto-generation failed:', data.error)
          }
        } catch (err) {
          console.error('Error generating auto-reflection:', err)
        }
      }

      // 3. Entry count for manual reflection
      const count = await getEntryCountForLastDays(30)
      setEntryCount(count)
      setCanGenerate(count >= 3)
      setIsComplete(count >= 30)
    }

    loadPageData()
  }, [])

  const handleGenerateReflection = async () => {
    const endDate = new Date()
    const startDate = subDays(endDate, 29)

    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) {
        console.error('No user logged in')
        setManualReflection('⚠️ Please log in to generate a reflection.')
        return
      }

      const token = await user.getIdToken()

      const response = await fetch('/api/generate-reflection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rangeStart: startDate.toISOString(),
          rangeEnd: endDate.toISOString(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setManualReflection(data.summary)
      } else {
        console.error(data.error || 'Failed to generate reflection')
        setManualReflection('⚠️ Something went wrong while generating your reflection.')
      }
    } catch (error) {
      console.error('Error:', error)
      setManualReflection('⚠️ Something went wrong while generating your reflection.')
    }
  }

  const handleSave = async () => {
    const user = getAuth().currentUser
    if (!user || !manualReflection) return

    const now = new Date()
    const rangeStart = subDays(now, 29)
    const rangeEnd = now

    await saveReflection({
      type: 'manual-30d',
      rangeStart,
      rangeEnd,
      summary: manualReflection,
      isComplete,
      savedManually: true,
    })

    alert('Reflection saved!')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Monthly Reflection</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Auto-Generated (Full Month)</h2>
        {autoReflection ? (
          <div className="bg-gray-100 p-4 rounded">
            <p className="text-sm text-gray-500 mb-2">
              📅 For {format(autoReflection.rangeStart.toDate(), 'MMMM d')} –{' '}
              {format(autoReflection.rangeEnd.toDate(), 'MMMM d')}
            </p>
            {autoReflection.summary}
          </div>
        ) : (
          <p className="text-gray-500">No reflection generated for this month yet.</p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Manual Reflection (Last 30 Days)</h2>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded mb-4 disabled:opacity-50"
          onClick={handleGenerateReflection}
          disabled={!canGenerate}
        >
          Generate Reflection
        </button>

        {entryCount < 30 && entryCount >= 3 && (
          <p className="text-yellow-600 mb-2">⚠️ Only {entryCount} entries found. This reflection is incomplete.</p>
        )}

        {manualReflection && (
          <div className="bg-gray-100 p-4 rounded mb-4">{manualReflection}</div>
        )}

        {manualReflection && (
          <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleSave}>
            Save Reflection
          </button>
        )}
      </section>
    </div>
  )
}


