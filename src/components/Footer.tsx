export default function Footer() {
  return (
    <footer className="w-full py-8 text-center">
      <p className="text-xs uppercase tracking-wider text-[#8888a0]">
        仅供娱乐，不构成专业建议
      </p>
      <p className="mt-2 text-xs uppercase tracking-wider text-[#8888a0] opacity-60">
        &copy; {new Date().getFullYear()} yuyu塔罗测算
      </p>
    </footer>
  )
}
