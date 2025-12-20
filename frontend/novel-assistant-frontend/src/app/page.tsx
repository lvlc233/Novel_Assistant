

"use client";


// 重新定向的方式
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/home');   // 立即 307 重定向
}


