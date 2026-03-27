import { notFound } from 'next/navigation'
import connectDB from '@/lib/db/connection'
import BlogPost from '@/lib/db/models/BlogPost'
import BlogCategory from '@/lib/db/models/BlogCategory'
import BlogTag from '@/lib/db/models/BlogTag'
import PostForm from '@/components/admin/posts/PostForm'

interface EditPostPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params
  await connectDB()

  const [post, categories, tags] = await Promise.all([
    BlogPost.findById(id).lean(),
    BlogCategory.find().sort({ name: 1 }).lean(),
    BlogTag.find().sort({ name: 1 }).lean(),
  ])

  if (!post) notFound()

  return (
    <PostForm
      initialData={JSON.parse(JSON.stringify(post))}
      categories={JSON.parse(JSON.stringify(categories))}
      tags={JSON.parse(JSON.stringify(tags))}
    />
  )
}
