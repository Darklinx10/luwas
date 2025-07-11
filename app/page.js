"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login"); // default route redirection
  }, [router]);

  return null; // could show a spinner while redirecting
}
