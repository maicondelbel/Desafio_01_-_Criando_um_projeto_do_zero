import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import Header from '../../components/Header';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter()

  const estimatedReadingTime = post.data.content.reduce((acc, content) => {
    const headingWordsCount = content.heading.split(' ').length
    const bodyWordsCount = RichText.asText(content.body).split(' ').length
    acc += headingWordsCount,
    acc += bodyWordsCount
    
    return acc
  }, 0)

  if (router.isFallback) {
    return <div>Carregando...</div>
  }

  return (
    <>
      <Header />
      <main>
        <section className={styles.heroBanner}>
          <img src={post.data.banner.url} alt="" />
        </section>
        <section className={commonStyles.container}>
          <h1>{post.data.title}</h1>
          <div className={styles.postInfo}>
            <div><FiCalendar />{ format(new Date(post.first_publication_date), 'dd MMM yyyy', { locale: ptBR } ) }</div>
            <div><FiUser /> { post.data.author }</div>
            <div><FiClock /> { Math.ceil( estimatedReadingTime / 200 )} min</div>
          </div>
          <article className={styles.post}>
            { post.data.content.map((item) => {
              return (
                <div key={item.heading}>
                  <h2>{item.heading}</h2>
                  {item.body.map((paragraph) => {
                    return (
                      <p key={paragraph.text}>{paragraph.text}</p>
                      )
                    })
                  }
                </div>
              )
            })}
          </article>
        </section>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts');

  const slugs = posts.results.map((slug) => {
    return {
      params: {
        slug: slug.uid
      }
    }
  })

  return {
    paths: slugs,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({params }) => {
  const { slug } = params
  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', slug.toString());

  return {
    props: {
      post: {
        first_publication_date: response.first_publication_date,
        data: {
          title: response.data.title,
          banner: {
            url: response.data.banner.url,
          },
          author: response.data.author,
          content: response.data.content,
        }
      }
    },
    revalidate: 60 * 60 //1 hour
  }

};
