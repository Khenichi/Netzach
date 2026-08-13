import { ref, type Ref } from "vue";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

// Singleton state
const isAdmin: Ref<boolean> = ref(false);
const showLoginModal: Ref<boolean> = ref(false);
const email: Ref<string> = ref("");
const password: Ref<string> = ref("");
const loginError: Ref<string> = ref("");
const isLoadingAuth: Ref<boolean> = ref(false);

let authInitialized = false;

export function useAuth() {
  if (!authInitialized) {
    authInitialized = true;
    onAuthStateChanged(auth, (user: User | null) => {
      isAdmin.value = !!user;
    });
  }

  const handleLogin = async (): Promise<boolean> => {
    isLoadingAuth.value = true;
    try {
      loginError.value = "";
      await signInWithEmailAndPassword(auth, email.value, password.value);
      showLoginModal.value = false;
      email.value = "";
      password.value = "";
      return true;
    } catch (err) {
      loginError.value = "Email atau Password Admin Salah!";
      return false;
    } finally {
      isLoadingAuth.value = false;
    }
  };

  const handleLogout = async (): Promise<void> => {
    await signOut(auth);
  };

  return {
    isAdmin,
    showLoginModal,
    email,
    password,
    loginError,
    isLoadingAuth,
    handleLogin,
    handleLogout,
  };
}
