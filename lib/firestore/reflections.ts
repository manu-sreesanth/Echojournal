import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  Timestamp,
} from 'firebase/firestore'

import { getAuth } from 'firebase/auth'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'

const db = getFirestore()

// Types
export interface ReflectionData {
  type: 'manual-7d' | 'manual-30d' | 'auto-weekly' | 'auto-monthly'
  rangeStart: Date
  rangeEnd: Date
  summary: string
  isComplete: boolean
  savedManually: boolean
}

// ✅ Fetch the latest auto reflection (weekly or monthly)
export async function fetchAutoReflection(type: 'weekly' | 'monthly') {
  const user = getAuth().currentUser
  if (!user) return null

  const now = new Date()
  const reflectionType = type === 'weekly' ? 'auto-weekly' : 'auto-monthly'

  const rangeStart = type === 'weekly'
    ? startOfWeek(now, { weekStartsOn: 0 }) // Sunday to Saturday
    : startOfMonth(now)

  const rangeEnd = type === 'weekly'
    ? endOfWeek(now, { weekStartsOn: 0 })
    : endOfMonth(now)

  const ref = collection(db, 'users', user.uid, 'reflections')
  const q = query(
    ref,
    where('type', '==', reflectionType),
    where('rangeStart', '==', Timestamp.fromDate(rangeStart)),
    where('rangeEnd', '==', Timestamp.fromDate(rangeEnd))
  )

  const snapshot = await getDocs(q)
  if (snapshot.empty) return null

  return snapshot.docs[0].data() as {
    summary: string
    rangeStart: Timestamp
    rangeEnd: Timestamp
    isComplete: boolean
  }
}

// ✅ Save manual (or auto) reflection
export async function saveReflection(data: ReflectionData) {
  const user = getAuth().currentUser
  if (!user) throw new Error('User not authenticated')

  const ref = collection(db, 'users', user.uid, 'reflections')

  const payload = {
    type: data.type,
    summary: data.summary,
    isComplete: data.isComplete,
    savedManually: data.savedManually,
    rangeStart: Timestamp.fromDate(data.rangeStart),
    rangeEnd: Timestamp.fromDate(data.rangeEnd),
    createdAt: Timestamp.now(),
  }

  await addDoc(ref, payload)
}
