import { ImageStyle, TextStyle, ViewStyle } from "react-native";
interface CustomStyle {
    [key: string]: string | number;
}
interface Style {
    [key: string]: CustomStyle | ViewStyle | TextStyle | ImageStyle | object;
}
declare function flattenStyles<T extends Style>(defaultStyle: T, overrideStyles: Array<T | undefined>): T;

interface MarkerStyle {
    color: string;
    opacity: number;
}

export interface MapsStyle extends Style {
    container: ViewStyle;
    loadingOverlay: ViewStyle;
    loadingIndicator: {
        color?: string;
    };
    marker: MarkerStyle;
}

export const defaultMapsStyle: MapsStyle = {
    container: {
        flex: 1,
        maxWidth: "100%",
        aspectRatio: 4 / 2
    },
    loadingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99,
        backgroundColor: "#fafafa",
        justifyContent: "center",
        alignItems: "center"
    },
    loadingIndicator: {},
    marker: {
        color: "red",
        opacity: 1
    }
};
