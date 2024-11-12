'use client';
import  { PLChart } from "@/app/components/PLChart";

export default function Home() {
  return (
    <div className="mx-auto p-4">
      <PLChart strikePrice={70000} premium={5000} isCall />
    </div>
  );
}
