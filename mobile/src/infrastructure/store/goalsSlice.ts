import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SavingsGoal } from '../../domain';

export interface GoalsState {
  goals: SavingsGoal[];
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
}

// Seed data. No backend for this exam — loaded in memory at startup.
const seedGoals: SavingsGoal[] = [
  { id: '1', name: 'Viaje a Cartagena', targetAmount: 3000000, accumulatedAmount: 1250000 },
  { id: '2', name: 'Fondo de emergencia', targetAmount: 5000000, accumulatedAmount: 4980000 },
  { id: '3', name: 'Laptop nueva', targetAmount: 4500000, accumulatedAmount: 4500000 },
];

const initialState: GoalsState = {
  goals: seedGoals,
  status: 'success',
};

// Progress is never stored here — it's derived from accumulatedAmount /
// targetAmount at display time (calculateProgress), so there is only one
// copy of the state and no cached percentage that can drift out of sync.
const goalsSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    goalUpdated(state, action: PayloadAction<SavingsGoal>) {
      const index = state.goals.findIndex(goal => goal.id === action.payload.id);
      if (index === -1) {
        state.goals.push(action.payload);
      } else {
        state.goals[index] = action.payload;
      }
    },
    goalsLoaded(state, action: PayloadAction<SavingsGoal[]>) {
      state.goals = action.payload;
    },
  },
});

export const { goalUpdated, goalsLoaded } = goalsSlice.actions;
export default goalsSlice.reducer;
