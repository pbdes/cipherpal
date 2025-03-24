import React from "react";
// import ImagePlaceholder from './icons/ImagePlaceholder'
import image from "../../connectImage.png"

export default function Image() {
    return(
        <div className="w-ful">
            <div className="">
                <img className="w-full rounded-full" alt="CipherPal Device" src={image} />
            </div>
        </div>
    );
}