import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type DateRange = [Date | null, Date | null];

interface FiltersState {
  roomsAppliedFilters: {
    'Room Status': string[];
    Sharing: string[];
    Floor: string[];
    Facilities: string[];
  };
  advBookingFilters: {
    Status: string[];
    FromToBooking: DateRange;
    FromToJoining: DateRange;
  };
  tenantsFilters: {
    Sharing: string[];
    Status: string[];
    FromToJoining: DateRange;
    'Download Status': string[];
  };
  expenseFilters: {
    Status: string[];
    FromTo: DateRange;
  };
  collectionFilters: {
    FromToPayment: DateRange;
  };
  duesFilters: {
    FromToDue: DateRange;
  };
}

const initialState: FiltersState = {
  roomsAppliedFilters: {
    'Room Status': [],
    Sharing: [],
    Floor: [],
    Facilities: [],
  },
  advBookingFilters: {
    Status: [],
    FromToBooking: [null, null],
    FromToJoining: [null, null],
  },
  tenantsFilters: {
    Sharing: [],
    Status: [],
    FromToJoining: [null, null],
    'Download Status': [],
  },
  expenseFilters: {
    Status: [],
    FromTo: [null, null],
  },
  collectionFilters: {
    FromToPayment: [null, null],
  },
  duesFilters: {
    FromToDue: [null, null],
  },
};

type FilterPayload = {
  key: string;
  value: string[] | DateRange;
};

// ✅ Key checkers
const isRoomKey = (key: string): key is keyof FiltersState['roomsAppliedFilters'] =>
  ['Room Status', 'Sharing', 'Floor', 'Facilities'].includes(key);
const isAdvBookingKey = (key: string): key is keyof FiltersState['advBookingFilters'] =>
  ['Status', 'FromToBooking', 'FromToJoining'].includes(key);
const isTenantKey = (key: string): key is keyof FiltersState['tenantsFilters'] =>
  ['Sharing', 'Status', 'FromToJoining', 'Download Status'].includes(key);
const isExpenseKey = (key: string): key is keyof FiltersState['expenseFilters'] =>
  ['Status', 'FromTo'].includes(key);
const isCollectionKey = (key: string): key is keyof FiltersState['collectionFilters'] =>
  ['FromToPayment'].includes(key);
const isDuesKey = (key: string): key is keyof FiltersState['duesFilters'] =>
  ['FromToDue'].includes(key);

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setRoomFilter: (state, action: PayloadAction<FilterPayload>) => {
      const { key, value } = action.payload;
      if (isRoomKey(key)) {
        state.roomsAppliedFilters[key] = value as string[];
      }
    },
    setAdvBookingFilter: (state, action: PayloadAction<FilterPayload>) => {
      const { key, value } = action.payload;
      if (isAdvBookingKey(key)) {
        if (key === 'Status') {
          state.advBookingFilters[key] = value as string[];
        } else if (key === 'FromToBooking' || key === 'FromToJoining') {
          state.advBookingFilters[key] = value as DateRange;
        }
      }
    },
    setTenantFilter: (state, action: PayloadAction<FilterPayload>) => {
      const { key, value } = action.payload;
      if (isTenantKey(key)) {
        if (key === 'FromToJoining') {
          state.tenantsFilters[key] = value as DateRange;
        } else {
          state.tenantsFilters[key] = value as string[];
        }
      }
    },
    setExpenseFilter: (state, action: PayloadAction<FilterPayload>) => {
      const { key, value } = action.payload;
      if (isExpenseKey(key)) {
        if (key === 'Status') {
          state.expenseFilters[key] = value as string[];
        } else if (key === 'FromTo') {
          state.expenseFilters[key] = value as DateRange;
        }
      }
    },
    setCollectionFilter: (state, action: PayloadAction<FilterPayload>) => {
      const { key, value } = action.payload;
      if (isCollectionKey(key)) {
        state.collectionFilters[key] = value as DateRange;
      }
    },
    setDuesFilter: (state, action: PayloadAction<FilterPayload>) => {
      const { key, value } = action.payload;
      if (isDuesKey(key)) {
        state.duesFilters[key] = value as DateRange;
      }
    },
    clearAllFilters: () => initialState,
  },
});

export const {
  setRoomFilter,
  setAdvBookingFilter,
  setTenantFilter,
  setExpenseFilter,
  setCollectionFilter,
  setDuesFilter,
  clearAllFilters,
} = filterSlice.actions;

export default filterSlice.reducer;
