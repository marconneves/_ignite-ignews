import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { GetStaticProps } from "next"
import { useSession } from 'next-auth/react'
import { useRouter } from "next/router";
import { RichText } from "prismic-dom";

import { getPrismicClient } from "../../../services/prismic";
import styles from '../post.module.scss';

type Post = {
  slug: string;
  title: string;
  content: string;
  updatedAt: string;

  excerpt: string;
  datePublished: string,
  dateModified: string,
  lang: string,
}

interface PostPreviewProps {
  post: Post
}

export default function PostPreview({ post }: PostPreviewProps) {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if(session?.activeSubscription){
      router.push(`/posts/${post.slug}`)
    }
  }, [session])

  return (
    <>
      <Head>
        <title>{post.title} | ig.news</title>

        <meta name="description" content={post.excerpt}/>

        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "NewsArticle",
              "datePublished": post.datePublished,
              "dateModified": post.dateModified,
              "author": { "@type": "Person", "name": "Marcon Willian" },
              "publisher": {
                "@type": "Person",
                "name": "Marcon Willian",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://github.com/MarconWillian.png"
                }
              }
            })
          }}
        />
      </Head>

      <main className={styles.container}>
        <article className={styles.post}>
          <h1>{post.title}</h1>
          <time dateTime={post.dateModified}>{post.updatedAt}</time>
          <div 
            className={`${styles.postContent} ${styles.previewContent}`}
            dangerouslySetInnerHTML={{
              __html: post.content
            }}
          />

          <div className={styles.continueReading}>
            Wanna continue reading?
            <Link href="/">
              <a>Subscribe now 🤗</a>
            </Link>
          </div>
          
        </article>
      </main>
    </>
  )
}

export const getStaticPaths = () => {
  return {
    paths: [],
    fallback: 'blocking'
  }
} 

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('post', String(slug), {});

  if(!response?.data){
    return {
      notFound: true
    }
  }

  const post = {
    slug,
    title: RichText.asText(response.data.title),
    content: RichText.asHtml(response.data.content.filter(content => content.type !== 'preformatted').splice(0, 3)),
    excerpt: response.data.content.find(content => content.type === 'paragraph')?.text ?? '',
    updatedAt: new Date(response.last_publication_date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }),
    datePublished: response.first_publication_date,
    dateModified: response.last_publication_date,
    lang: response.lang,
  }

  return {
    props: {
      post
    },
    revalidate: ( 60 * 30 ), // 30 minutes 
  }
}