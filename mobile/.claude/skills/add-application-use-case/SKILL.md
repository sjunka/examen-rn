---
name: add-application-use-case
description: >
  Scaffold a new application-layer use case in mobile/src/application
  following the GetGoals/ConfirmDeposit convention: a class that depends on
  the SavingsGoalRepository port (never a concrete adapter), one execute()
  method, a colocated test using InMemorySavingsGoalRepository, and a
  presentation hook that wires it to the real ReduxSavingsGoalRepository.
  Use when adding a new business operation to the mobile app (e.g. "delete a
  goal", "rename a goal") — not for domain rules or UI-only changes.
---

# Add an application use case (mobile)

Convention already in the codebase — `GetGoals` and `ConfirmDeposit` are the
two real examples. This skill encodes that pattern so a third use case reads
like the first two.

## Steps

1. **Class in `mobile/src/application/<useCase>.ts`.**
   - Constructor takes `private readonly repository: SavingsGoalRepository`
     — the port from `savingsGoalRepository.ts`, never
     `ReduxSavingsGoalRepository` or `InMemorySavingsGoalRepository`
     directly.
   - One public method, `execute(...)`. Business validation (does the goal
     exist, is the operation legal) lives here — shape validation (is the
     amount numeric, is the id a non-empty string) does not; that's a
     parser's job (see `webMessages.ts`) and is already done before a use
     case runs.
   - Import domain helpers (`isGoalCompleted`, etc.) from `../domain`, never
     reimplement a rule that already lives there.

2. **Colocated test, `<useCase>.test.ts`, same directory.**
   - Build fixtures with `InMemorySavingsGoalRepository` from
     `../infrastructure/inMemorySavingsGoalRepository` — never a mock/stub
     hand-rolled per test.
   - Cover: happy path, the "not found" path (returns `null`, leaves state
     untouched — do not throw for a missing id), and every business branch
     `execute()` adds.

3. **Wire it with a presentation hook, `mobile/src/presentation/use<UseCase>.ts`.**
   - `useStore<RootState>()` from `react-redux`, construct
     `new <UseCase>(new ReduxSavingsGoalRepository(store))` inside a
     `useCallback`/`useMemo`, dependency array `[store, ...params]`.
   - Decide `useCallback` (fire-and-return, e.g. a submit handler) vs.
     `useMemo` (read-once value) by how the screen uses the result — **not**
     `useSelector`. Screens whose WebView must survive unrelated store
     updates read through the hook once per mount, not reactively; see
     `useGoalSnapshot.ts` for why. If the new use case's screen doesn't have
     that constraint, a plain `useSelector` may still be simpler — this
     hook shape is for the case that does.

## Non-goals

- Don't put fetch/storage/native-module calls in the use case — that's
  `infrastructure`'s job, reached only through the port.
- Don't add a second repository interface for a use case that only reads
  one aggregate — `SavingsGoalRepository` already covers `findAll`,
  `findById`, `save`; extend it only if the operation genuinely needs a new
  primitive the port doesn't have yet.
