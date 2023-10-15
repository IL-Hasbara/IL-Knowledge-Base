import { useEffect, useMemo, useState } from "react";
import { ActionFunctionArgs, json, type MetaFunction } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { namedAction } from "remix-utils/named-action";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Tag, TagInput } from "~/components/ui/tag-input";
import { fetchPublicLinks, submitLink } from "~/lib/server";
import { cn } from "~/lib/utils";
import { useToast } from "~/components/ui/use-toast";

export const meta: MetaFunction = () => {
  return [
    { title: "IL Knowledge Base" },
    {
      name: "description",
      content:
        "Tag and search for videos regarding Israel-Hamas War for the purpose of Hasbara",
      ["og:image"]: "/social-preview.png",
    },
  ];
};

export const action = async ({ request }: ActionFunctionArgs) => {
  return namedAction(request, {
    submitLink: async () => {
      const formData = await request.formData();
      const label = formData.get("label")?.toString();
      const link = formData.get("link")?.toString();
      const key = formData.get("key")?.toString();
      if (!label || !link || !key) {
        return json({ link: null, error: null });
      }

      const payload = {
        key,
        label,
        link,
        tags: formData.getAll("tags").map((value) => value.toString()),
      };
      try {
        return await submitLink(payload);
      } catch (error: any) {
        return json({ link: null, error: error.message });
      }
    },
  });
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
  const { toast } = useToast();
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const actionData = useActionData<typeof action>();
  console.log(actionData);

  useEffect(() => {
    if (actionData?.link) {
      toast({ title: "Link submitted successfully!" });
    } else if (actionData?.error) {
      toast({ title: actionData.error, variant: "destructive" });
    }
  }, [actionData]);

  return (
    <div className="h-screen bg-slate-950">
      <main className="w-full h-full flex flex-col items-center max-w-[70%] mx-auto py-20">
        <SubmitLinkDialog />

        <h1 className="text-white text-4xl font-bold">IL Knowledge Base</h1>
        <p className="text-slate-400 max-w-[75ch] text-center mt-4">
          Here you'll find links to all the videos and Hasbara content. You can
          search for a video by its title or filter videos by tags. Good luck!
        </p>

        <Separator className="mt-8 bg-slate-600" />
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

        <section className="justify-center flex flex-wrap gap-6">
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

function SubmitLinkDialog() {
  const [tags, setTags] = useState<Tag[]>([]);

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) setTags([]);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" className="self-end mb-8">
          Submit link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit a Link</DialogTitle>
          <DialogDescription>
            Give your link a descriptive label, this will be used in future
            search functionality.
          </DialogDescription>
        </DialogHeader>
        <Form id="submit-link-form" method="post" className="grid gap-6">
          <input type="hidden" name="_action" value="submitLink" />
          {tags.map((tag) => (
            <input type="hidden" name="tags" value={tag.text} key={tag.id} />
          ))}
          <div className="grid gap-2">
            <Label htmlFor="key">Your key:</Label>
            <Input type="text" id="key" name="key" />
            <p className="text-sm text-slate-500 mt-1">
              Contact the administrators to get a key. Without a key - you can't
              submit a link.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="link">Link to source:</Label>
            <Input type="text" id="link" name="link" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="label">Descriptive label:</Label>
            <Input type="text" id="label" name="label" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tags">Related tags:</Label>
            <TagInput
              id="tags"
              tags={tags}
              setTags={setTags}
              placeholder="Type a tag and press the Enter/Return key"
            />
          </div>
        </Form>
        <DialogFooter className="gap-4">
          <DialogClose>Close</DialogClose>
          <DialogTrigger asChild>
            <Button type="submit" form="submit-link-form">
              Submit
            </Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
