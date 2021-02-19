# The Mini-Apps Pose Viewer

![build](https://github.com/InformaticsMatters/mini-apps-pose-viewer/workflows/build/badge.svg)
![build latest](https://github.com/InformaticsMatters/mini-apps-pose-viewer/workflows/build%20latest/badge.svg)
![build tag](https://github.com/InformaticsMatters/mini-apps-pose-viewer/workflows/build%20tag/badge.svg)
![build stable](https://github.com/InformaticsMatters/mini-apps-pose-viewer/workflows/build%20stable/badge.svg)

![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/InformaticsMatters/mini-apps-pose-viewer)

This allows a SDF file with docking poses and scores to be effectively analysed.
The expectation is to be easily able to explore 10's of thousands of poses
selecting those to examine in detail using a combination of scores in the SDF file.
The selected poses can be compared in 3D in the context of the receptor binding
site that is specified as a PDB format file.

![Pose viewer](/images/pose-viewer.png)

There are 4 main re-usable components:

1.  A small component that allows to define how to process the input SDF file.
2.  A scatter plot component that allows the scores in the SDF file to be
    visualised and to select molecules of interest.
3.  A card view component that shows the molecules selected from the scatter
    plot as 2D structures along with their properties (scores)
4.  A re-usable NGL viewer component that allows to view the 3D poses of the
    molecules selected from the card view to be viewed in the context of the
    protein binding site.

## Building

The application is distributed as a container image, normally built
automatically using GitLab Actions. To understand how to build the app refer
to the project's various `.gitlab/workflows`.

## Deployment

Container images are automatically deployed from a GitLab Action using
Job Templates on our AWX server. The Job Templates are launched using
scripts that the Action downloads from our [Trigger AWX] project.

## Application versioning

The application version (defined in `package.json`) is automatically set from
within the Dockerfile. If the `tag` build argument is not defined the version
of the application is `0.0.0`.

The CI/CD process in Travis sets the tag to the prevailing git tag.
So, to build and push version `1.0.0` tag the repository with `1.0.0`.

> As a consequence you **MUST NOT** adjust the version line in the

    package.json file.

## Development Alongside the [component library](https://github.com/InformaticsMatters/react-sci-components)

Currently the best way to develop apps alongside the component library, `squonk-theme` and `data-tier-client` is to

1. Clone the `react-sci-components` repo,
2. Clone the app into the `/packages` directory,
3. Run `lerna link` in the root of `react-sci-components`
4. In terminal(s) run `yarn start` inside of the package(s) that are going to be developed

Optionally, ensure the app packages in your VSCode workspace are listed first as VSCode current [doesn't handle subrepos that well](https://github.com/microsoft/vscode/issues/37947). For example:

```json
"folders": [
    {
        "path": "packages/pose-viewer"
    },
    {
        "path": "packages/fragnet-ui"
    },
    {
        "path": "."
    },
],
```

---

[trigger awx]: https://github.com/InformaticsMatters/trigger-awx
