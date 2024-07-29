"use client";
import { Wrapper, Dashboard } from "@onvo-ai/react";
import { useState, useEffect } from "react";

const DashboardInnerPage: React.FC<{
  params: { id: string };
}> = ({ params }) => {
  let [token, setToken] = useState("");
  useEffect(() => {
    setToken(localStorage.getItem("token") || "");
  }, []);

  if (token === "") return <div>Loading...</div>;

  return (
    <main className="w-screen h-screen relative">
      <Wrapper
        baseUrl={
          process.env.NEXT_PUBLIC_BASE_URL || "https://dashboard.onvo.ai"
        }
        token={token}
      >
        <Dashboard id={params.id} />
      </Wrapper>
    </main>
  );
};

export default DashboardInnerPage;
