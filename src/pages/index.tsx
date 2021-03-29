import { GetStaticProps } from 'next';

import Head from 'next/head';
import Link from 'next/link';

import Prismic from '@prismicio/client';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiUser, FiCalendar } from 'react-icons/fi';

import { RichText } from 'prismic-dom';

import { useState } from 'react';
import Header from '../components/Header';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

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

export default function Home({ postsPagination }: HomeProps) {
  const [
    statePostsPagination,
    setStatePostsPagination,
  ] = useState<PostPagination>(postsPagination);

  async function loadMorePosts(): Promise<void> {
    const response = await fetch(postsPagination.next_page);
    const { results } = await response.json();

    const listPosts: PostPagination = {
      ...statePostsPagination,
      next_page: results.next_pag,
    };

    results.forEach(result => {
      const post: Post = {
        first_publication_date: result.first_publication_date,
        data: result?.data,
        uid: result.uid,
      };
      listPosts.results.push(post);
    });
    setStatePostsPagination(listPosts);
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>
      <main className={commonStyles.container}>
        <Header />
        <div className={styles.content}>
          {statePostsPagination?.results.map(post => (
            <Link key={post.uid} href={`/post/${post?.uid}`}>
              <a>
                <h1>{post.data.title}</h1>
                <h3>{post.data.subtitle}</h3>
                <div className={styles.postFooter}>
                  <time>
                    <FiCalendar />{' '}
                    {format(
                      new Date(post?.first_publication_date),
                      'dd MMM yyyy',
                      { locale: ptBR }
                    )}
                  </time>
                  <p>
                    <FiUser /> {post.data.author}
                  </p>
                </div>
              </a>
            </Link>
          ))}
          {statePostsPagination.next_page && (
            <button type="button" onClick={loadMorePosts}>
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    { pageSize: 1 }
  );

  const postsPagination: PostPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: post?.data,
      };
    }),
  };

  return {
    props: {
      postsPagination,
    },
  };
};
