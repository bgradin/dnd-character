import React from 'react'
import { register } from "../../../data";

import './CharacterPassiveWisdom.scss';

export default function CharacterPassiveWisdom() {
    return (
        <div className="character-passive-wisdom">
            <div className="character-passive-wisdom__head">
                <span className="character-passive-wisdom__head-btn">
                    <svg width="53" height="51" viewBox="0 0 53 51" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M11.0355 2.14636C2.43353 9.01471 -1.70797 20.986 0.658031 32.1475C1.87653 37.8977 4.51053 42.6391 8.95253 47.0797L12.858 50.984H30.0935H47.3285L49.859 48.9846L51.973 47V41.1132C51.2887 41.7876 50.5226 42.0092 49.1685 42.2433C45.406 42.8946 37.171 45.0339 33.7085 46.26C30.596 47.3622 29.4565 47.4851 22.3735 47.4851H14.4985L11.562 44.5496C1.14053 34.1313 0.929533 17.852 11.079 7.24683L14.187 3.99878H22.459C30.263 3.99878 30.973 4.08074 35.011 5.44531C37.365 6.24056 42.057 7.48517 45.437 8.21094L45.5854 8.24278C49.2609 9.03172 50.8758 9.37833 51.973 10.3249L52.33 4.49866L49.758 2.24927L47.1855 0L30.427 0.0219727L13.6685 0.0445557L11.0355 2.14636ZM49.296 7.28662C49.4665 7.11617 48.8325 6.31605 47.887 5.5083C46.3355 4.18222 45.8165 4.03728 42.5435 4.01929C40.5495 4.00779 38.9185 4.10467 38.9185 4.23413C38.9185 4.65 48.975 7.60802 49.296 7.28662ZM42.0925 47.4851C45.7675 47.4851 46.0135 47.4116 47.799 45.7756C48.8255 44.8354 49.551 43.9523 49.412 43.8129C49.148 43.5494 39.0415 46.6959 38.539 47.1982C38.381 47.3562 39.98 47.4851 42.0925 47.4851Z" fill="black"/>
                    </svg>
                    <input
                        name="passiveWisdom"
                        type="text"
                        id="passiveWisdom"
                        className="character-passive-wisdom__input"
                        ref={(input) => register(input)}
                    />
                </span>
            </div>
            <label htmlFor="passiveWisdom" className="character-passive-wisdom__body">
                <span>Passive Wisdom (Perception)</span>
            </label>
        </div>
    )
}
