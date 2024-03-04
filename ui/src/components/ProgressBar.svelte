<script lang="ts">
    import { cubicOut } from "svelte/easing";
    import { tweened } from "svelte/motion";
    import chroma from "chroma-js";

    // A number in the range [0,1] that indicates the current progress level
    export let progress: number;

    //The duration of animation
    export let duration: number = 1000;

    //Animation easing function
    export let easing: (t: number) => number = cubicOut;
    export let baseColor: string = "gray";
    export let baseThickness: number = 4;
    export let thickness: number = 10;
    export let gradientColors: string[] = ["white"];
    export let gradientPositions: number[] = [0, 1];

    const gradient = chroma.scale(gradientColors).domain(gradientPositions);

    let _progress = tweened(0, {
        duration: duration,
        easing: easing,
    });

    $: color = gradient($_progress).hex();
    $: _progress.set(progress);
</script>

<main style="--color: {color}; --thickness: {thickness}px; --base-color: {baseColor}; --base-thickness: {baseThickness}px; ">
    <div id="base"/>
    <div id="progress" style="width:{$_progress * 100}%;"/>
</main>

<style>
    main {
        position: relative;
        width: 100%;
        height: calc(max(var(--thickness), var(--base-thickness)));
        background-color: var(--background-color, transparent);
    }

    #base {
        position: absolute;
        top: 0;
        bottom: 0;
        margin: auto;
        margin-inline: 0px;

        width: 100%;
        height: var(--base-thickness);
        background-color: var(--base-color, "gray");
    }

    #progress {
        position: absolute;
        top: 0;
        bottom: 0;
        margin: auto;
        margin-inline: 0px;

        height: var(--thickness);
        background-color: var(--color);
    }
</style>
