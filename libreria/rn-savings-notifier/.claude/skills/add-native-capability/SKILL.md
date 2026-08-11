---
name: add-native-capability
description: >
  Scaffold a new TurboModule capability in rn-savings-notifier end to end:
  Spec method, validated JS wrapper, iOS Swift implementation, the ObjC++
  glue, README docs, and mocked unit tests — the same five-layer shape
  showConfirmDialog and notifyGoalCompleted already follow. Use when adding
  a new native-bridged method to this package, not for changes confined to
  one existing method.
---

# Add a native capability (rn-savings-notifier)

Every capability in this package touches the same five places, in this
order. Skipping one is how the JS spec and the native side drift.

## Steps

1. **`src/NativeRnSavingsNotifier.ts`** — add the method to `interface Spec
   extends TurboModule`. A `/** ... */` doc comment stating: what it does,
   exactly what the promise resolves with, and when (if ever) it rejects —
   user choice/declined permission is almost never a rejection, only a real
   platform error is. This comment is the contract codegen has no way to
   express in the generated protocol.

2. **`src/index.tsx`** — export a wrapper function, not the raw native
   method. Validate every string argument with the existing
   `requireNonBlankString(value, argName)` helper before calling native;
   return `Promise.reject(error)` on a validation failure instead of
   throwing sync (callers always get a promise). Doc comment points back at
   the `Spec` method for the full contract instead of repeating it.

3. **`ios/RnSavingsNotifierImpl.swift`** — the real logic, as a method on
   `RnSavingsNotifierImpl` taking `resolve: @escaping RCTPromiseResolveBlock,
   reject: @escaping RCTPromiseRejectBlock`. Follow the existing
   error-code convention: `reject("SOME_CODE", "human message", nil)` for
   real failures; resolve (don't reject) for a user decision the caller
   needs to branch on via the resolved value, not a catch block.

4. **`ios/RnSavingsNotifier.mm` + `.h`** — thin forwarding method only:
   `[[RnSavingsNotifierImpl shared] yourMethodWith...:...]`. No logic here,
   ever — this file exists only because TurboModule codegen generates an
   Objective-C++ protocol, never Swift directly (see ADR 0001).

5. **`README.md`** — add the method under `## API` with the same shape as
   the existing two entries (signature, what it does, validation/rejection
   behavior, any error codes), and list the new files touched under
   `## Arquitectura` if any are new. If Android isn't implemented for this
   method either, say so under `## Pendientes` with the same
   fails-loud-not-silent framing already there — never leave a platform gap
   undocumented.

6. **`src/__tests__/index.test.ts`** — mock `NativeRnSavingsNotifier`
   (`jest.mock('../NativeRnSavingsNotifier', ...)`) and cover: delegates
   with the exact arguments, resolves the native's resolved value, rejects
   without calling native for each invalid argument, and propagates a real
   native rejection unchanged.

## Non-goals

- Don't add a capability whose entire job is JS-side (no native API
  involved) — that doesn't belong in a TurboModule spec, write it as a
  plain function instead.
- Don't touch Android unless you're actually implementing Kotlin for it —
  an unimplemented method must reject with `NOT_IMPLEMENTED` (see the
  existing Android stub), never fail silently or crash.
