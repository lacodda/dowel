import { useState } from 'react'
import { works as sampleWorks, you, type Work } from '../../fixtures/world'

/*
 * What the demo remembers.
 *
 * It starts empty, on purpose: the first screen anyone sees of a product is
 * its first day, and that is the screen the blocks have the most to say
 * about. The sample works - the stand's fictional world - arrive when asked
 * for, and resetting the workspace takes them away again.
 *
 * Only the signed-in state outlives a reload, and only for the tab: a demo
 * that forgot you on every refresh would be tiresome, one that remembered
 * you for good would be a demo of nothing but its own dashboard.
 */

const SIGNED_IN = 'dowel.demo.signed-in'

function readSession(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === 'yes'
  } catch {
    // Storage can throw rather than return null - a private window, blocked
    // site data. Signed out is a demo that still works.
    return false
  }
}

function writeSession(key: string, value: boolean): void {
  try {
    if (value) window.sessionStorage.setItem(key, 'yes')
    else window.sessionStorage.removeItem(key)
  } catch {
    // As above: the session is a convenience, not a requirement.
  }
}

export interface Profile {
  name: string
  email: string
}

export function useDemoState() {
  const [signedIn, setSignedIn] = useState(() => readSession(SIGNED_IN))
  const [works, setWorks] = useState<readonly Work[]>([])
  const [profile, setProfile] = useState<Profile>({ name: you.name, email: you.email })

  return {
    signedIn,
    signIn: () => {
      writeSession(SIGNED_IN, true)
      setSignedIn(true)
    },
    signOut: () => {
      writeSession(SIGNED_IN, false)
      setSignedIn(false)
    },
    works,
    bringSamples: () => setWorks(sampleWorks),
    reset: () => setWorks([]),
    profile,
    setProfile,
  }
}

export type DemoState = ReturnType<typeof useDemoState>
