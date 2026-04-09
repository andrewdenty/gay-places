import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { VenueLink } from "./mdx/venue-link";
import { Callout } from "./mdx/callout";
import { ArticleImage } from "./mdx/article-image";

const mdxComponents = {
  VenueLink,
  Callout,
  ArticleImage,
  h2: (props: React.ComponentProps<"h2">) => (
    <h2
      className="mt-10 mb-4 text-[32px] leading-[1.2] tracking-[-0.64px] font-normal font-serif text-[var(--foreground)]"
      {...props}
    />
  ),
  h3: (props: React.ComponentProps<"h3">) => (
    <h3
      className="mt-8 mb-3 text-[18px] font-semibold text-[var(--foreground)]"
      {...props}
    />
  ),
  p: (props: React.ComponentProps<"p">) => (
    <p
      className="my-4 text-[15px] leading-[1.7] text-[var(--foreground)]"
      {...props}
    />
  ),
  a: (props: React.ComponentProps<"a">) => (
    <a
      className="text-[var(--foreground)] underline underline-offset-2 decoration-[var(--foreground)] transition-colors"
      {...props}
    />
  ),
  ul: (props: React.ComponentProps<"ul">) => (
    <ul
      className="my-4 ml-5 list-disc text-[15px] leading-[1.7] text-[var(--foreground)] marker:text-[var(--muted-foreground)]"
      {...props}
    />
  ),
  ol: (props: React.ComponentProps<"ol">) => (
    <ol
      className="my-4 ml-5 list-decimal text-[15px] leading-[1.7] text-[var(--foreground)] marker:text-[var(--muted-foreground)]"
      {...props}
    />
  ),
  li: (props: React.ComponentProps<"li">) => (
    <li className="my-1" {...props} />
  ),
  blockquote: (props: React.ComponentProps<"blockquote">) => (
    <blockquote
      className="my-8 border-l-[3px] border-[var(--foreground)] pl-6 text-[18px] leading-[1.6] text-[var(--foreground)] italic font-serif"
      {...props}
    />
  ),
  hr: () => <hr className="my-10 border-[var(--border)]" />,
  strong: (props: React.ComponentProps<"strong">) => (
    <strong className="font-semibold text-[var(--foreground)]" {...props} />
  ),
};

export function ArticleBody({ source }: { source: string }) {
  return (
    <div className="max-w-[680px]">
      <MDXRemote
        source={source}
        components={mdxComponents}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
          },
        }}
      />
    </div>
  );
}
