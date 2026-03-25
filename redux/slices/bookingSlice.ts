import { createSlice, PayloadAction} from '@reduxjs/toolkit';

interface Location {
    id: number;
    name: string;
    branch: string;
}

interface Guests {
    adults: number;
    children: number;
    infants: number;
}

interface StayType {
    id: string;
    duration: string;
    price: string;
    description: string;
}

interface SchedulePreference {
    id: string;
    label: string;
    description: string;
}

interface SelectedRoom {
    id: string;
    name: string;
    price: string;
    pricePerNight: string;
    location?: string;
    tower?: string;
    blocked_dates?: Array<{
        from_date: string;
        to_date: string;
        reason?: string;
    }>;
}

interface BookingState {
    location: Location | null;
    checkInDate: string;
    checkOutDate: string;
    guests: Guests;
    stayType: StayType | null;
    schedulePreference: SchedulePreference | null;
    selectedRoom: SelectedRoom | null;
    isFromSearch: boolean;
}

const initialState: BookingState = {
    location: null,
    checkInDate: '',
    checkOutDate: '',
    guests: {
        adults: 1,
        children: 0,
        infants: 0,
    },
    stayType: null,
    schedulePreference: null,
    selectedRoom: null,
    isFromSearch: false
};

const bookingSlice = createSlice({
    name: 'booking',
    initialState,
    reducers: {
        setLocation: (state, action: PayloadAction<Location | null>) => {
            state.location = action.payload
        },
        setCheckInDate: (state, action: PayloadAction<string>) => {
            state.checkInDate = action.payload;
        },
        setCheckOutDate: (state, action: PayloadAction<string>) => {
            state.checkOutDate = action.payload;
        },
        setGuests: (state, action: PayloadAction<Guests>) => {
            state.guests = action.payload;
        },
        setStayType: (state, action: PayloadAction<StayType | null>) => {
            state.stayType = action.payload;
        },
        setSchedulePreference: (state, action: PayloadAction<SchedulePreference | null>) => {
            state.schedulePreference = action.payload;
        },
        setIsFromSearch: (state, action: PayloadAction<boolean>) => {
            state.isFromSearch = action.payload;
        },
        setSelectedRoom: (state, action: PayloadAction<SelectedRoom | null>) => {
            state.selectedRoom = action.payload;
        },
        updateBookingDate: (state, action: PayloadAction<Partial<BookingState>>) => {
            return {...state, ...action.payload };
        },
        clearBooking: () => initialState,
    }
});

export const {
    setLocation,
    setCheckInDate,
    setCheckOutDate,
    setGuests,
    setStayType,
    setSchedulePreference,
    setIsFromSearch,
    setSelectedRoom,
    updateBookingDate,
    clearBooking
} = bookingSlice.actions

export default bookingSlice.reducer