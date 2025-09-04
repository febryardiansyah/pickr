"use client";

import React from "react";
import { Button } from "../../global/ButtonComponent";

export default function HomeComponent() {
  return (
    <div className="w-full flex items-center justify-center py-16">
      <div className="grid grid-cols-2 gap-6 w-full h-full max-w-md">
        <Button size="lg" className="w-full" variant="primary" shadow={false}>
          Create Raffle
        </Button>
        <Button size="lg" className="w-full" variant="outline" shadow={false}>
          Join Raffle
        </Button>
      </div>
    </div>
  );
}
