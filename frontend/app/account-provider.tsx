"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type SessionUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  role_label: string;
  description: string;
};

type AccountContextValue = {
  user: SessionUser | null;
  token: string;
  ready: boolean;
  setSession: (token: string, user: SessionUser) => void;
  logout: () => void;
};

const storageKey = "artbuild-token";
const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey) ?? "";
    if (!saved) {
      setReady(true);
      return;
    }
    setToken(saved);
    fetch("/api/account", { headers: { Authorization: `Bearer ${saved}` } })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("no");
        }
        return response.json();
      })
      .then((data: { user: SessionUser }) => setUser(data.user))
      .catch(() => {
        window.localStorage.removeItem(storageKey);
        setToken("");
      })
      .finally(() => setReady(true));
  }, []);

  function setSession(nextToken: string, nextUser: SessionUser) {
    window.localStorage.setItem(storageKey, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }

  function logout() {
    window.localStorage.removeItem(storageKey);
    setToken("");
    setUser(null);
  }

  return (
    <AccountContext.Provider value={{ user, token, ready, setSession, logout }}>{children}</AccountContext.Provider>
  );
}

export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) {
    throw new Error("Учётная запись не подключена.");
  }
  return value;
}

const linkClass = "text-[13px] text-[#1A1A1A]/70 hover:text-[#1A1A1A]";
const pillClass = "rounded-full bg-[#1A1A1A] px-4 py-2 text-[13px] text-white";

export function AccountNav() {
  const { user, ready } = useAccount();
  if (!ready) {
    return null;
  }
  if (!user || user.role === "guest") {
    return (
      <>
        <a href="/login" className={linkClass}>
          Вход
        </a>
      </>
    );
  }
  return (
    <a href="/requests" className={linkClass}>
      Заявки
    </a>
  );
}

export function HeaderCta() {
  const { user, ready } = useAccount();
  if (!ready) {
    return null;
  }
  if (!user || user.role === "guest") {
    return (
      <a href="/register?kind=customer" className={pillClass}>
        Задание
      </a>
    );
  }
  return (
    <a href="/account" className={pillClass}>
      Кабинет
    </a>
  );
}
