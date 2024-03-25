# `@david/publish-on-tag`

Publishes a package to JSR with a version based on the current tag.

This enables you to not have to store a version number in git and instead rely
on tags for publishing. Additionally, it's a single line to add to your workflow file.

## Usage

Currently only works on GHA.

1. Update your deno.json(c)/jsr.json(c) to have a zeroed out version:

   ```json
   {
     "name": "@scope/pkg",
     "version": "0.0.0",
     "exports": "./mod.ts"
   }
   ```

1. Update your GHA to run this package instead of `deno publish`:

   ```yml
   - name: Publish on tag
     # replace with pinned version of this package
     run: deno run -A jsr:@david/publish-on-tag@x.x.x
     # or forward additional arguments to `deno publish`
     # run: deno run -A jsr:@david/publish-on-tag@x.x.x --allow-slow-types
   ```

   For an example, see the [ci.yml](./.github/workflows/ci.yml) file in this repository.

1. Draft a new release on GitHub and publish the release with a tag.
   - Alternatively, tag your repo with a version and push the changes.
     - ex. `git tag 0.1.0 && git push 0.1.0`
   - Note: The tag may have a leading `v` prefix.
   - This will kick off the workflow run that will update the deno.json before
     publish.
