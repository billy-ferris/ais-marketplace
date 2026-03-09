declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: import('@ais/shared').UserRole;
    };
  }
}

export {};
