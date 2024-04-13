<script lang="ts">
    import _ from "lodash";
    import { tick } from "svelte";

    const FLOATER_SHAPES = [
        "circle.svg",
        "circle.svg",
        "music-circle.svg",
        "music-circle-outline.svg",
    ];

    let canvas: HTMLDivElement;

    async function generateNewFloater() {
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
                opacity: 0,
                height: "0px",
                width: "0px",
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

        //console.log(shape, startX, startY, endX, endY, startDeg, endDeg, duration, imgSize);

        //Generate HTML element for the floater
        let floaterElement = document.createElement("img");

        //Apply style properties
        floaterElement.src = `floaters/${shape}`;
        floaterElement.style.zIndex = "-100";
        floaterElement.style.position = "absolute";
        floaterElement.style.height = "0px";
        floaterElement.style.width = "0px";

        //Add DOM element and animate it
        await tick();
        canvas?.appendChild(floaterElement);
        await tick();
        floaterElement.animate(keyframes, duration);

        //Remove DOM element after animation time has elapsed
        setTimeout(() => {
            floaterElement?.remove();
        }, duration);
    }

    //Make 5 floaters right away
    for(let i=0; i<5; i++){
        generateNewFloater();
    }

    //Regularly generate new floaters
    setInterval(generateNewFloater, 3000);
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
