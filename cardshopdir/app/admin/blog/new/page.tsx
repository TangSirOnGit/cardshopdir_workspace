import { PostForm } from "../post-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = { title: "New post - Admin" }

export default function NewPostPage() {
  return (
    <div>
      <Link
        href="/admin/blog"
        className="mb-4 inline-flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to posts
      </Link>
      <h1 className="mb-6 text-lg font-semibold tracking-tight">New post</h1>
      <PostForm />
    </div>
  )
}
