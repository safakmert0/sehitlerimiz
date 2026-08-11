type Listener = (done: boolean) => void;

let done = false;
const listeners = new Set<Listener>();

export function isOnboardingDone(): boolean {
  return done;
}

export function setOnboardingDone(value: boolean): void {
  if (done === value) return;
  done = value;
  listeners.forEach((l) => l(value));
}

export function subscribeOnboardingDone(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}