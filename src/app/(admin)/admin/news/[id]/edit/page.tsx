import { notFound } from 'next/navigation'
import connectDB from '@/lib/db/connection'
import News from '@/lib/db/models/News'
import NewsForm from '@/components/admin/news/NewsForm'

interface EditNewsPageProps {
  params: Promise<{ id: string }>
}

export default async function EditNewsPage({ params }: EditNewsPageProps) {
  const { id } = await params
  await connectDB()

  const newsItem = await News.findById(id).lean()

  if (!newsItem) notFound()

  return (
    <NewsForm
      initialData={JSON.parse(JSON.stringify(newsItem))}
      newsId={id}
    />
  )
}
