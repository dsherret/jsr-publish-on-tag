# `@david/publish-on-tag`

Publishes a package to JSR with a version based on the current git tag or
otherwise runs a dry publish.

This enables you to not have to store a version number in git and instead rely
on tags for publishing. The usage is a single line to add to your GHA workflow
file.

## Usage

Currently only works on GHA (PRs welcome for other CIs).

1. Update your deno.json(c)/jsr.json(c) to not have a version field:

   ```json
   {
     "name": "@scope/pkg",
     "exports": "./mod.ts"
   }
   ```

1. Update your GHA to run this package instead of `deno publish`:

   ```yml
   - name: Publish on tag
     # replace x.x.x with pinned version of this package
     run: deno run -A jsr:@david/publish-on-tag@x.x.x

     # or forward additional arguments to `deno publish`
     # run: deno run -A jsr:@david/publish-on-tag@x.x.x --allow-slow-types
   ```

   For an example, see the [ci.yml](./.github/workflows/ci.yml) file in this
   repository.

1. Ensure your workflow has sufficient permissions to publish (see
   [JSR's publishing instructions](https://jsr.io/docs/publishing-packages#publishing-from-github-actions)):

   ```yml
   permissions:
     contents: read
     id-token: write
   ```

1. On [jsr.io](https://jsr.io/), link your package to your GitHub repo in your
   package's publish settings.

1. Draft a new release on GitHub and publish the release with a tag.
   - Alternatively, tag your repo with a version and push the changes.
     - ex. `git tag 0.1.0 && git push 0.1.0`
   - Note: The tag may have a leading `v` prefix.
   - This will kick off the workflow run that will publish with the tagged
     version.
