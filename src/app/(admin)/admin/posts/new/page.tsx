import connectDB from '@/lib/db/connection'
import BlogCategory from '@/lib/db/models/BlogCategory'
import BlogTag from '@/lib/db/models/BlogTag'
import PostForm from '@/components/admin/posts/PostForm'

export default async function NewPostPage() {
  await connectDB()

  const [categories, tags] = await Promise.all([
    BlogCategory.find().sort({ name: 1 }).lean(),
    BlogTag.find().sort({ name: 1 }).lean(),
  ])

  return (
    <PostForm
      categories={JSON.parse(JSON.stringify(categories))}
      tags={JSON.parse(JSON.stringify(tags))}
    />
  )
}
