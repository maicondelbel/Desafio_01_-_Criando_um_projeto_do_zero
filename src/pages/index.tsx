import { GetStaticProps } from 'next';
import Header from '../components/Header';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR'; 


import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useState } from 'react';
import Link from 'next/link';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({postsPagination}: HomeProps) {
  const [posts, setPosts] = useState(postsPagination);

  function handleLoadMorePosts() {
    fetch(posts.next_page)
      .then(response => response.json())
      .then(data => {
        const newPosts = data.results.map((post) => {
          return {
            uid: post.uid,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
            first_publication_date: post.first_publication_date
          }
        })

        setPosts({
            results: [
              ...posts.results,
              ...newPosts
            ],
            next_page: newPosts.next_page
        });

      });
  }

  
  return (
    <>
    <Header />
    <main className={commonStyles.container}>
      {posts.results.map((article) => {
        return (
          <article className={styles.post} key={article.uid}>
          <Link href={`/post/${article.uid}`}>
            <h2>{article.data.title}</h2>
          </Link>
          <p>{article.data.subtitle}</p>
          <div>
            <div className={styles.postInfoDetails}>
              <FiCalendar /> {format(new Date(article.first_publication_date), 'dd MMM yyyy', { locale: ptBR } )}
            </div>
            <div className={styles.postInfoDetails}>
              <FiUser /> {article.data.author}
            </div>
          </div>
        </article>
        )
      })}
      {posts.next_page && (
        <div className={styles.loadMore}>
          <button onClick={handleLoadMorePosts}>Carregar mais posts</button>
        </div>
      )}
    </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', { pageSize: 1});

  const posts = postsResponse.results.map((post) => {
    return {
      uid: post.uid,
      first_publication_date:  post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }
  })

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      }
    }
  }
};
