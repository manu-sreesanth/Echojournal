import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { subDays, startOfDay } from 'date-fns'

const db = getFirestore()

export async function getEntryCountForLastDays(days: number): Promise<number> {
  const user = getAuth().currentUser
  if (!user) return 0

  const uid = user.uid
  const fromDate = startOfDay(subDays(new Date(), days - 1))

  const q = query(
    collection(db, `users/${uid}/journalEntries`),
    where('createdAt', '>=', fromDate)
  )

  const snap = await getDocs(q)
  return snap.size
}
