/**
 * This file was generated from NativeMaps.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { ActionValue, DynamicValue, EditableValue, ListValue, NativeIcon, ObjectItem } from "mendix";

export interface MarkerSetsType {
    markerData?: ListValue;
    address?: (item: ObjectItem) => EditableValue<string>;
    latitude?: (item: ObjectItem) => EditableValue<BigJs.Big>;
    longitude?: (item: ObjectItem) => EditableValue<BigJs.Big>;
    title?: (item: ObjectItem) => EditableValue<string>;
    description?: (item: ObjectItem) => EditableValue<string>;
    onClick?: (item: ObjectItem) => ActionValue;
    icon?: DynamicValue<NativeIcon>;
    iconSize: number;
    color?: string;
}

export type DefaultZoomLevelEnum = "world" | "continent" | "country" | "city" | "town" | "streets" | "building";

export type MinZoomLevelEnum = "world" | "continent" | "country" | "city" | "town" | "streets" | "building";

export type MaxZoomLevelEnum = "world" | "continent" | "country" | "city" | "town" | "streets" | "building";

export type MapTypeEnum = "standard" | "satellite";

export type ProviderEnum = "default" | "google";

export interface MarkerSetsPreviewType {
    markerData: {} | null;
    address: string;
    latitude: string;
    longitude: string;
    title: string;
    description: string;
    onClick: {} | null;
    icon: { type: "glyph"; iconClass: string; } | { type: "image"; imageUrl: string; } | null;
    iconSize: number | null;
    color: string;
}

export interface NativeMapsProps<Style> {
    name: string;
    style: Style[];
    markerSets: MarkerSetsType[];
    fitToMarkers: boolean;
    centerAddress?: DynamicValue<string>;
    centerLatitude?: DynamicValue<BigJs.Big>;
    centerLongitude?: DynamicValue<BigJs.Big>;
    defaultZoomLevel: DefaultZoomLevelEnum;
    minZoomLevel: MinZoomLevelEnum;
    maxZoomLevel: MaxZoomLevelEnum;
    mapType: MapTypeEnum;
    provider: ProviderEnum;
    interactive: boolean;
    showsUserLocation: boolean;
}

export interface NativeMapsPreviewProps {
    class: string;
    style: string;
    markerSets: MarkerSetsPreviewType[];
    fitToMarkers: boolean;
    centerAddress: string;
    centerLatitude: string;
    centerLongitude: string;
    defaultZoomLevel: DefaultZoomLevelEnum;
    minZoomLevel: MinZoomLevelEnum;
    maxZoomLevel: MaxZoomLevelEnum;
    mapType: MapTypeEnum;
    provider: ProviderEnum;
    interactive: boolean;
    showsUserLocation: boolean;
}
