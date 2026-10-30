import { useSyncExternalStore } from "react"
/** Shared calculator state so the hero orb and the full calculator move together. amt=null -> currency default. */
let state: { amt: number | null; ti: number } = { amt: null, ti: 3 }
const subs = new Set<() => void>()
export const setCalc = (p: Partial<typeof state>) => { state = { ...state, ...p }; subs.forEach((f) => f()) }
export const useCalc = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => state, () => state)
