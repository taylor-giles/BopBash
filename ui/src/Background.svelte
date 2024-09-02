<script lang="ts">
    import _ from "lodash";
    import { tick } from "svelte";

    const FLOATER_SHAPES = [
        "circle.svg",
        "circle.svg",
        "music-circle.svg",
        "bop-bash-single-color.svg",
    ];

    let canvas: HTMLDivElement;

    async function generateNewFloater(startingVisibility: number = 0) {
        if (!document.hidden) {
            //Choose a random shape
            let shape = _.sample(FLOATER_SHAPES);

            //Choose random start and end positions
            let startX = _.random(-10, 110);
            let startY = _.random(-10, 110);
            let endX = _.random(-10, 110);
            let endY = _.random(-10, 110);

            //Choose random start and end rotations
            let startDeg = _.random(0, 720);
            let endDeg = _.random(0, 720);

            //Choose random duration
            let duration = _.random(30000, 90000);

            //Choose random size (in rem)
            let imgSize = _.random(3, 20);

            //Generate animation keyframes
            let keyframes: Keyframe[] = [
                {
                    opacity: startingVisibility,
                    height: `${startingVisibility * imgSize}rem`,
                    width: `${startingVisibility * imgSize}rem`,
                    left: `${startX}%`,
                    top: `${startY}%`,
                    transform: `rotate(${startDeg}deg)`,
                },
                {
                    opacity: 1,
                    height: `${imgSize}rem`,
                    width: `${imgSize}rem`,
                },
                {
                    opacity: 0,
                    height: "0px",
                    width: "0px",
                    left: `${endX}%`,
                    top: `${endY}%`,
                    transform: `rotate(${endDeg}deg)`,
                },
            ];

            //Generate HTML element for the floater
            let floaterElement = document.createElement("img");

            //Apply style properties
            floaterElement.src = `floaters/${shape}`;
            floaterElement.style.zIndex = "-100";
            floaterElement.style.position = "absolute";
            floaterElement.style.height = `${startingVisibility * imgSize}px`;
            floaterElement.style.width = `${startingVisibility * imgSize}px`;

            //Add DOM element and animate it
            await tick();
            canvas?.appendChild(floaterElement);
            await tick();
            let animation = floaterElement.animate(keyframes, duration);

            //Remove DOM element after animation is finished
            animation.onfinish = () => floaterElement?.remove();
        }
    }

    /**
     * Makes a number of floaters immediately, with starting visibility ranging from 0-maxVisibility
     * @param n The number of floaters to make
     * @param visibilityFactor The starting visibility of the most visible floater
     */
    async function makeInitialFloaters(n: number, maxVisibility: number = 0.5) {
        //Make 5 floaters right away
        for (let i = 0; i < n; i++) {
            generateNewFloater((maxVisibility/n) * i);
        }
    }

    //Make some floaters immediately after loading
    makeInitialFloaters(5, 0.5);

    //Pause floater animations when application is hidden
    document.addEventListener("visibilitychange", () => {
        for(let child of canvas?.children){
            child.getAnimations().forEach((animation) => {
                document.hidden ? animation.pause() : animation.play();
            });
        }
    });

    //Regularly generate new floaters
    setInterval(generateNewFloater, 2300);
</script>

<div id="background-floaters" bind:this={canvas} />

<style>
    #background-floaters {
        width: 100%;
        height: 100%;
        position: absolute;
        left: 0%;
        top: 0%;
        z-index: -100;
        overflow: hidden;
        opacity: 0.07;
    }
</style>
