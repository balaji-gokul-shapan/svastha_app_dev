import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchWithAuth } from "../auth-utils";

const initialState = {
  createLoading: false,
  success: false,
  error: null,
  createdRecord: null,
};
const GET_ALL_ENT_SCREENINGS_REPORT = "/api/ent-assessment/all";
const UPDATE_ENT_SCREENING_REPORT = "/api/ent-assessment/update";

// Optional query params (page, per_page, camp_id, …). Empty values are skipped
// so the request never sends `?key=undefined`. The backend paginates this list,
// answering with current_page / per_page / last_page / total / from / to.
const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

export const getAllEntScreeningReport = createAsyncThunk(
  "registerEntScreening/getAllEntScreeningReport",
  async (params = {}, { getState, rejectWithValue, dispatch }) => {
    try {
      const endpoint = `${GET_ALL_ENT_SCREENINGS_REPORT}${buildQueryString(params)}`;
      const { response } = await fetchWithAuth(
        endpoint,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
        dispatch,
      );
      const body = await response.text();
      if (!response.ok) {
        let errorPayload;

        try {
          errorPayload = body ? JSON.parse(body) : null;
        } catch {
          errorPayload = body;
        }

        throw (
          errorPayload || { message: "Failed to fetch ENT screening report" }
        );
      }

      try {
        return JSON.parse(body);
      } catch {
        return body;
      }
    } catch (error) {
      return rejectWithValue(
        error || { message: "Unable to fetch ENT screening report" },
      );
    }
  },
);

export const updateEntScreening = createAsyncThunk(
  "registerEntScreening/updateEntScreening",
  async ({ id, student_id, ...data }, { rejectWithValue, dispatch }) => {
    try {
      const targetId = id || student_id;
      const normalizedId = String(targetId ?? "").trim();
      if (!normalizedId) {
        throw new Error("Screening or Student ID is required for update");
      }

      const isFormData =
        typeof FormData !== "undefined" && data instanceof FormData;

      // Include student_id in the body since the server expects it
      const bodyData = { ...data, student_id };
      const options = {
        method: "PATCH",
        body: isFormData ? data : JSON.stringify(bodyData ?? {}),
      };
      if (!isFormData) {
        options.headers = { "Content-Type": "application/json" };
      }

      const endpoint = `${UPDATE_ENT_SCREENING_REPORT}/${encodeURIComponent(normalizedId)}`;
      const { response } = await fetchWithAuth(endpoint, options, dispatch);

      if (!response.ok) {
        const errorText = await response.text();
        let errorPayload;

        try {
          errorPayload = errorText ? JSON.parse(errorText) : null;
        } catch {
          errorPayload = errorText;
        }

        throw errorPayload || { message: "Failed to update ENT screening" };
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(
        error || { message: "Unable to update ENT screening" },
      );
    }
  },
);
export const createEntScreening = createAsyncThunk(
  "registerEntScreening/createEntScreening",
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const { response } = await fetchWithAuth(
        "/api/ent-assessment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload ?? {}),
        },
        dispatch,
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorPayload;

        try {
          errorPayload = errorText ? JSON.parse(errorText) : null;
        } catch {
          errorPayload = errorText;
        }

        throw errorPayload || { message: "Failed to create ENT screening" };
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(
        error || { message: "Unable to create ENT screening" },
      );
    }
  },
);

const registerEntScreeningSlice = createSlice({
  name: "registerEntScreening",
  initialState,
  reducers: {
    resetRegisterEntScreeningState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createEntScreening.pending, (state) => {
        state.createLoading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(createEntScreening.fulfilled, (state, action) => {
        state.createLoading = false;
        state.success = true;
        state.createdRecord = action.payload;
      })
      .addCase(createEntScreening.rejected, (state, action) => {
        state.createLoading = false;
        state.success = false;
        state.error = action.payload || "Unable to create ENT screening";
      })
      .addCase(updateEntScreening.pending, (state) => {
        state.updateLoading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updateEntScreening.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.success = true;
        state.updatedRecord = action.payload;
      })
      .addCase(updateEntScreening.rejected, (state, action) => {
        state.updateLoading = false;
        state.success = false;
        state.error = action.payload || "Unable to update ENT screening";
      });
  },
});

export const { resetRegisterEntScreeningState } =
  registerEntScreeningSlice.actions;

export default registerEntScreeningSlice.reducer;
