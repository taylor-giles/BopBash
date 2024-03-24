<script lang="ts">
    import { cubicOut } from "svelte/easing";
    import { tweened } from "svelte/motion";
    import chroma from "chroma-js";
    import { tick } from "svelte";

    // A number in the range [0,1] that indicates the current progress level
    export let progress: number;

    //The duration of animation
    export let duration: number = 1000;

    //Animation easing function
    export let easing: (t: number) => number = cubicOut;

    //Thickness of the progress bar
    export let thickness: number = 10;

    export let baseColor: string = "gray";
    export let baseThickness: number = 4;
    export let gradientColors: string[] = ["white"];
    export let gradientPositions: number[] = [0, 1];

    //Dimensions
    let width: number, height: number;
    $: radius =
        width && height
            ? Math.min(width / 2, height / 2) -
              Math.max(thickness, baseThickness) / 2
            : 0;

    const gradient = chroma.scale(gradientColors).domain(gradientPositions);

    let _progress = tweened(0, {
        duration: duration,
        easing: easing,
    });

    $: progressAngle = $_progress * 360;
    $: color = gradient($_progress).hex();
    $: _progress.set(progress);

    /**
     * Returns the coordinates of the point at the given angle of a circle centered in the center of this element.
     * @param angle The angle, in degrees, to find coordinates for
     */
    function getCoordinates(angle: number): { x: number; y: number } {
        let angleRads = ((angle - 90) * Math.PI) / 180.0;
        return {
            x: width / 2 + radius * Math.cos(angleRads),
            y: height / 2 + radius * Math.sin(angleRads),
        };
    }

    /**
     * Returns a string which, when set as the 'd' property of an SVG path, will build an arc spanning the given angles
     * @param startAngle The angle to start the arc at, in degrees
     * @param endAngle The angle to end the arc at, in degrees
     */
    async function buildArc(
        startAngle: number,
        endAngle: number,
    ): Promise<string> {
        await tick();
        startAngle = startAngle > 360 ? startAngle % 360 : startAngle;
        endAngle = endAngle > 360 ? endAngle % 360 : endAngle;
        let start = getCoordinates(startAngle);
        let end = getCoordinates(endAngle);
        let largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

        if ((start.x != end.x && start.y != end.y) || startAngle == endAngle) {
            return `
                M ${start.x} ${start.y} 
                A ${radius},${radius} 0 ${largeArcFlag},1 ${end.x},${end.y}
            `;
        } else {
            // Account for full-circle case (start and end are the same)
            return `
                M ${width / 2} ${height / 2}
                m ${radius},0
                a ${radius},${radius} 0 1,0 -${radius * 2},0
                a ${radius},${radius} 0 1,0  ${radius * 2},0
            `;
        }
    }
</script>

<main bind:clientWidth={width} bind:clientHeight={height}>
    <!-- Rerender whenever dimensions change (to redraw SVGs at the correct location) -->
    {#key [width, height]}
        <svg id="base-ring">
            {#await buildArc(0, 360) then d}
                <path
                    {d}
                    stroke={baseColor}
                    stroke-width={baseThickness}
                    fill="none"
                />
            {/await}
        </svg>
        <svg id="progress-ring">
            {#await buildArc(0, progressAngle) then d}
                <path
                    {d}
                    stroke={color}
                    stroke-width={thickness}
                    fill="none"
                />
            {/await}
        </svg>
    {/key}
</main>

<style>
    main {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: var(--background-color, transparent);
    }

    #base-ring {
        position: absolute;
        width: 100%;
        height: 100%;
    }

    #progress-ring {
        position: absolute;
        width: 100%;
        height: 100%;
    }
</style>
