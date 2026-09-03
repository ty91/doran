import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <h1 className="text-xl font-semibold">페이지를 찾을 수 없습니다</h1>
      <Link href="/" className="text-sm text-zinc-500 underline hover:text-zinc-900">
        미팅 목록으로
      </Link>
    </div>
  );
}
