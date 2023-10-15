import { json, type MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useMemo, useState } from "react";
import { Separator } from "~/components/ui/separator";
import { fetchPublicLinks } from "~/lib/server";
import { cn } from "~/lib/utils";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const loader = async () => {
  const links = await fetchPublicLinks();
  return json({ links });
};

export default function Index() {
  const { links } = useLoaderData<typeof loader>();
  const tags = useMemo(
    () =>
      links
        .map((link) => link.tags)
        .reduce((s, tags) => {
          return [...new Set(s.concat(tags))];
        }, []),
    links,
  );
  const [activeTags, setActiveTags] = useState<string[]>([]);

  return (
    <div className="h-screen bg-slate-950">
      <main className="w-full h-full flex flex-col items-center py-20">
        <h1 className="text-white text-4xl font-bold">IL Knowledge Base</h1>
        <p className="text-slate-400 max-w-[75ch] text-center mt-4">
          Here you'll find links to all the videos and Hasbara content. You can
          search for a video by its title or filter videos by tags. Good luck!
        </p>

        <Separator className="mt-8 bg-slate-600 max-w-[70%]" />
        <section className="mt-8 mb-10">
          <h2 className="text-white text-xl font-semibold text-center">
            Filter by tags:
          </h2>
          <div className="flex justify-center flex-wrap gap-6 mt-4">
            {tags.map((tag) => (
              <button
                type="button"
                className={cn(
                  "text-sm border px-3 py-1 rounded-full cursor-pointer",
                  activeTags.includes(tag)
                    ? "bg-white border-white text-slate-800"
                    : "bg-transparent hover:bg-slate-800 border-slate-300 text-slate-100",
                )}
                onClick={() =>
                  setActiveTags((activeTags) => {
                    if (activeTags.includes(tag)) {
                      return activeTags.filter((t) => t !== tag);
                    } else {
                      return [...activeTags, tag];
                    }
                  })
                }
                key={tag}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        <section className="justify-center flex flex-wrap gap-6 max-w-[70%]">
          {links
            .filter((link) => {
              if (!activeTags.length) {
                return true;
              }
              if (activeTags.some((tag) => link.tags.includes(tag))) {
                return true;
              }

              return false;
            })
            .map((link) => (
              <article
                key={link.$id}
                className="border-2 rounded-md border-slate-200 bg-slate-700 hover:bg-slate-600"
              >
                <Link to={link.link} className="block p-6" target="_blank">
                  <div className="text-white font-medium max-w-[25ch]">
                    {link.label || link.link}
                  </div>
                  <div className="mt-2 text-sm text-slate-200">
                    Tags: {link.tags.join(", ")}
                  </div>
                </Link>
              </article>
            ))}
        </section>
      </main>
    </div>
  );
}
