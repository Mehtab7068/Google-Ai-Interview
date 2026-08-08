import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'https://google-ai-interview-express-backend.onrender.com/api/sessions';

export const getSessionById = createAsyncThunk(
  'sessions/getById',
  async (sessionId, thunkAPI) => {
    try {
      if (!sessionId || sessionId === 'undefined') {
        return thunkAPI.rejectWithValue('Invalid Session ID');
      }
      const token = thunkAPI.getState().auth?.user?.token;
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`${API_URL}/${sessionId}`, config);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const submitAnswer = createAsyncThunk(
  'sessions/submitAnswer',
  async ({ sessionId, formData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth?.user?.token;
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      };
      const response = await axios.post(`${API_URL}/${sessionId}/answer`, formData, config);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const endSession = createAsyncThunk(
  'sessions/endSession',
  async (sessionId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth?.user?.token;
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.post(`${API_URL}/${sessionId}/end`, {}, config);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const initialState = {
  activeSession: null,
  isLoading: false,
  isError: false,
  message: ''
};

export const sessionSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    resetSessionState: (state) => {
      state.activeSession = null;
      state.isLoading = false;
      state.isError = false;
      state.message = '';
    },
    // Socket listener dispatch target
    setRealtimeSessionUpdate: (state, action) => {
      if (state.activeSession) {
        state.activeSession = {
          ...state.activeSession,
          ...action.payload,
          // Preserve questions array cleanly without making it undefined
          questions: action.payload?.questions || state.activeSession.questions || []
        };
      } else {
        state.activeSession = {
          ...action.payload,
          questions: action.payload?.questions || []
        };
      }
      if (action.payload?.message) {
        state.message = action.payload.message;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Session
      .addCase(getSessionById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSessionById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeSession = {
          ...action.payload,
          questions: Array.isArray(action.payload?.questions) ? action.payload.questions : []
        };
      })
      .addCase(getSessionById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Submit Answer
      .addCase(submitAnswer.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.activeSession) {
          state.activeSession = {
            ...action.payload,
            questions: Array.isArray(action.payload?.questions) ? action.payload.questions : state.activeSession.questions
          };
        }
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // End Session
      .addCase(endSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(endSession.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(endSession.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  }
});

export const { resetSessionState, setRealtimeSessionUpdate } = sessionSlice.actions;
export default sessionSlice.reducer;