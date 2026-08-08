import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/sessions`;

export const getSessions = createAsyncThunk(
  'sessions/getAll',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth?.user?.token;
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(API_URL, config);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const createSession = createAsyncThunk(
  'sessions/create',
  async (sessionData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth?.user?.token;
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.post(API_URL, sessionData, config);
      const payload = response.data;
      if (payload?.sessionId && !payload._id) {
        payload._id = payload.sessionId;
      }
      return payload;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteSession = createAsyncThunk(
  'sessions/delete',
  async (sessionId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth?.user?.token;
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.delete(`${API_URL}/${sessionId}`, config);
      return sessionId;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

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
  sessions: [],
  activeSession: null,
  isLoading: false,
  isGenerating: false,
  isError: false,
  isSuccess: false,
  message: ''
};

export const sessionSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isGenerating = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
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
      // Get all sessions
      .addCase(getSessions.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSessions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessions = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(getSessions.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Create session
      .addCase(createSession.pending, (state) => {
        state.isGenerating = true;
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.isSuccess = true;
        state.sessions = [action.payload, ...state.sessions];
      })
      .addCase(createSession.rejected, (state, action) => {
        state.isGenerating = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete session
      .addCase(deleteSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessions = state.sessions.filter((session) => session._id !== action.payload);
      })
      .addCase(deleteSession.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
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

export const { reset, resetSessionState, setRealtimeSessionUpdate } = sessionSlice.actions;
export default sessionSlice.reducer;