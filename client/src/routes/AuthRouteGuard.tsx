import React, { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/features/auth";

interface AuthRouteGuardProps {
  children: React.ReactNode;
  featureName?: string;
}

/**
 * Route guard that renders the page UI directly and displays the AuthModal
 * above the page UI when unauthenticated.
 * If the user closes the AuthModal without authenticating, they are
 * automatically redirected to the landing page ("/").
 */
export function AuthRouteGuard({ children }: AuthRouteGuardProps) {
  const { isAuthenticated, isLoading, isAuthModalOpen, openAuthModal } = useAuth();
  const [, setLocation] = useLocation();
  const modalWasOpenRef = useRef(false);

  // Automatically open the AuthModal when arriving on a protected page unauthenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isAuthModalOpen && !modalWasOpenRef.current) {
      openAuthModal("login");
    }
  }, [isLoading, isAuthenticated, isAuthModalOpen, openAuthModal]);

  // Track that the modal has been opened for this protected route session
  useEffect(() => {
    if (isAuthModalOpen) {
      modalWasOpenRef.current = true;
    }
  }, [isAuthModalOpen]);

  // When the user dismisses / closes the AuthModal without logging in, redirect to landing page ("/")
  useEffect(() => {
    if (modalWasOpenRef.current && !isAuthModalOpen && !isAuthenticated && !isLoading) {
      modalWasOpenRef.current = false;
      setLocation("/");
    }
  }, [isAuthModalOpen, isAuthenticated, isLoading, setLocation]);

  return <>{children}</>;
}

export default AuthRouteGuard;
