import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterData = {
  name: string;
  email: string;
  password: string;
  referralCode?: string;
};

export type UserProfile = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  id: string;
  name: string;
  email: string;
  createdAt: string;
  avatarUrl?: string;
  bio?: string;
  telegramId: string;
};

export type Task = {
  _id: string;
  title: string;
  icon: string;
  description: string;
  category: string;
  pointsReward: number;
  requirement: string;
  verificationMethod: string;
  verificationData: string;
  isActive: boolean;
  taskType: "ingame" | "partners";
  status: "pending" | "approved" | "rejected";
  userStatus: "pending" | "approved" | "rejected" | "available";
  type: "one-time" | "daily" | "socaial";
  action: string;
  completedAt?: string;
  deadline?: string;
};

export type Referral = {
  id: string;
  first_name: string;
  createdAt: string;
};

export type ReferralInfo = {
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  pointsEarned: number;
};

export type DashboardData = {
  completedTasks: number;
  pendingTasks: number;
  points: number;
  totalEarned: number;
  referralCount: number;
};

export type userData = {
  telegramId: string;
  first_name: string;
  last_name: string;
  username: string;
};

// Helper for handling HTTP errors
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "An error occurred" }));
    throw new Error(errorData.message || "An error occurred");
  }
  return response.json();
};

// Fetch options with credentials included for cookies
const authHeader = () => ({
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include" as RequestCredentials, // Include cookies in requests
});

// Authentication APIs
export const authAPI = {
  login: async (credentials: LoginCredentials) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include", // Include credentials to save cookies
      });
      const data = await handleResponse(response);

      return data;
    } catch (error) {
      const message = (error as Error).message || "Login failed";
      toast.error(message);
      throw error;
    }
  },

  register: async (userData: RegisterData) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
        credentials: "include",
      });

      return await handleResponse(response);
    } catch (error) {
      const message = (error as Error).message || "Registration failed";
      toast.error(message);
      throw error;
    }
  },

  logout: () => {
    // Send request to logout endpoint to clear cookies
    fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch((err) => console.error("Logout error:", err));

    window.location.href = "/login";
  },
  sessionAuth: async (data: { sessionToken: string }) => {
    const response = await fetch(`${API_URL}/auth/telegram-oauth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Session authentication failed");
    }

    return response.json();
  },

  telegramOauth: async (userData: userData) => {
    try {
      const response = await fetch(`${API_URL}/auth/telegramOauth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
        credentials: "include",
      });

      return await handleResponse(response);
    } catch (error) {
      console.log(error);
    }
  },

  validateToken: async () => {
    try {
      const response = await fetch(`${API_URL}/auth/validate`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  },
};

// User Profile APIs
export const profileAPI = {
  getProfile: async () => {
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        ...authHeader(),
        credentials: "include",
      });
      return await handleResponse(response);
    } catch (error) {
      console.log("Failed to fetch profile");
      throw error;
    }
  },

  updateProfile: async (profile: Partial<UserProfile>) => {
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PUT",
        ...authHeader(),
        credentials: "include",
        body: JSON.stringify(profile),
      });

      return await handleResponse(response);
    } catch (error) {
      toast.error("Failed to update profile");
      throw error;
    }
  },
};

// Task APIs
export const taskAPI = {
  getAllTasks: async () => {
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        ...authHeader(),
        credentials: "include",
      });
      return await handleResponse(response);
    } catch (error) {
      toast.error("Failed to fetch tasks");
      throw error;
    }
  },

  getTaskById: async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${id}`, {
        ...authHeader(),
        credentials: "include",
      });
      return await handleResponse(response);
    } catch (error) {
      toast.error("Failed to fetch task details");
      throw error;
    }
  },

  completeTask: async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${id}/complete`, {
        method: "POST",
        ...authHeader(),
        credentials: "include",
      });

      return await handleResponse(response);
    } catch (error) {
      toast.error("Failed to submit task");
      throw error;
    }
  },

  verifyTask: async (taskId: string, action: string, telegramId: string) => {
    try {
      const response = await fetch(`${API_URL}/tasks/verify/${action}`, {
        method: "POST",
        body: JSON.stringify({ taskId, telegramId }),
        ...authHeader(),
        credentials: "include",
      });

      return await handleResponse(response);
    } catch (error) {
      if (error instanceof Error) {
        console.log(error);
        toast.error(error.message);
      } else {
        console.log("unknown error", error);
      }
    }
  },

  connectWallet: async (
    taskId: string,
    action: string,
    walletAddress: string
  ) => {
    try {
      const response = await fetch(`${API_URL}/tasks/verify/${action}`, {
        method: "POST",
        body: JSON.stringify({ taskId, walletAddress }),
        ...authHeader(),
        credentials: "include",
      });

      return await handleResponse(response);
    } catch (error) {
      if (error instanceof Error) {
        console.log(error);
        toast.error(error.message);
      } else {
        console.log("unknown error", error);
      }
    }
  },

  verifyInvite: async (
    taskId: string,
    action: string,
    totalInvited: number
  ) => {
    try {
      const response = await fetch(`${API_URL}/tasks/verify/${action}`, {
        method: "POST",
        body: JSON.stringify({ taskId, totalInvited }),
        ...authHeader(),
        credentials: "include",
      });

      return await handleResponse(response);
    } catch (error) {
      if (error instanceof Error) {
        console.log(error.message);
        toast.error(error.message);
      } else {
        console.log("unknown error", error);
      }
    }
  },

  completeOnboarding: async (taskId: string, action: string) => {
    try {
      const response = await fetch(`${API_URL}/tasks/verify/${action}`, {
        method: "POST",
        body: JSON.stringify({ taskId }),
        ...authHeader(),
        credentials: "include",
      });

      return await handleResponse(response);
    } catch (error) {
      console.log(error);
      toast.error("Complete all others task then check back.");
    }
  },
};

// Referral APIs
export const referralAPI = {
  getReferralInfo: async () => {
    try {
      const response = await fetch(`${API_URL}/referrals`, {
        ...authHeader(),
        credentials: "include",
      });
      return await handleResponse(response);
    } catch (error) {
      toast.error("Failed to fetch referral information");
      throw error;
    }
  },

  getReferralsList: async () => {
    try {
      const response = await fetch(`${API_URL}/referrals/list`, {
        ...authHeader(),
        credentials: "include",
      });
      return await handleResponse(response);
    } catch (error) {
      toast.error("Failed to fetch referrals list");
      throw error;
    }
  },

  validateReferralCode: async (code: string) => {
    const response = await fetch(`${API_URL}/referral/validate/${code}`);
    return await handleResponse(response);
  },
};

// Dashboard API
export const dashboardAPI = {
  getData: async () => {
    try {
      const response = await fetch(`${API_URL}/users/dashboard`, {
        ...authHeader(),
        credentials: "include",
      });
      return await handleResponse(response);
    } catch (error) {
      toast.error("Failed to fetch dashboard data");
      throw error;
    }
  },
};
