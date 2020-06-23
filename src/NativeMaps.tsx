import { Component, createElement, createRef } from "react";
import { ActionValue, ValueStatus } from "mendix";
import { MapsStyle, defaultMapsStyle } from "./ui/Styles";
import { Icon } from "mendix/components/native/Icon";
import MapView, { LatLng, Marker as MarkerView } from "react-native-maps";
import { DefaultZoomLevelEnum, NativeMapsProps, MarkerSetsType as MarkerSetProps } from "../typings/NativeMapsProps";
import { View, ActivityIndicator, Platform } from "react-native";
import { flattenStyles } from "./utils/common";
import { CachedGeocoder } from "./utils/CachedGeocoder";

type Props = NativeMapsProps<MapsStyle>;

interface State {
    status: Status;
    markers?: Marker[];
}

const enum Status {
    LoadingMarkers = "loadingMarkers",
    LoadingMap = "loadingMap",
    MapReady = "mapReady",
    CameraAlmostReady = "cameraAlmostReady",
    CameraReady = "cameraReady"
}

interface Marker {
    key: string;
    props: MarkerSetProps;
    coordinate: LatLng;
    title?: string;
    description?: string;
    onPress?: ActionValue;
}

interface ParsedMarker {
    key: string;
    props: MarkerSetProps;
    coordinate: LatLng | null;
    title?: string;
    description?: string;
    onPress?: ActionValue;
}

export class NativeMaps extends Component<Props, State> {
    readonly state: State = {
        status: Status.LoadingMarkers
    };

    private readonly onMapReadyHandler = this.onMapReady.bind(this);
    private readonly onRegionChangeCompleteHandler = this.onRegionChangeComplete.bind(this);
    private readonly styles = flattenStyles(defaultMapsStyle, this.props.style);
    private readonly mapViewRef = createRef<MapView>();
    private readonly geocoder = new CachedGeocoder();

    componentDidMount(): void {
        this.parseMarkers();
    }

    componentDidUpdate(): void {
        if (this.state.status === Status.LoadingMarkers) {
            this.parseMarkers();
        }
    }

    UNSAFE_componentWillReceiveProps(): void {
        if (this.state.status === Status.CameraReady) {
            this.parseMarkers();
        }
    }

    render(): JSX.Element {
        return (
            <View style={this.styles.container} testID={this.props.name}>
                {this.state.status !== Status.LoadingMarkers && (
                    <MapView
                        ref={this.mapViewRef}
                        provider={this.props.provider === "default" ? null : this.props.provider}
                        mapType={this.props.mapType}
                        showsUserLocation={this.props.showsUserLocation}
                        showsMyLocationButton={this.props.showsUserLocation}
                        showsTraffic={false}
                        minZoomLevel={toZoomValue(this.props.minZoomLevel)}
                        maxZoomLevel={toZoomValue(this.props.maxZoomLevel)}
                        rotateEnabled={this.props.interactive}
                        scrollEnabled={this.props.interactive}
                        pitchEnabled={false}
                        zoomEnabled={this.props.interactive}
                        style={{ flex: 1, alignSelf: "stretch" }}
                        liteMode={!this.props.interactive}
                        cacheEnabled={!this.props.interactive}
                        showsPointsOfInterest={false}
                        mapPadding={{ top: 40, right: 20, bottom: 20, left: 20 }}
                        onMapReady={this.onMapReadyHandler}
                        onRegionChangeComplete={this.onRegionChangeCompleteHandler}
                    >
                        {this.state.markers && this.state.markers.map(marker => this.renderMarker(marker))}
                    </MapView>
                )}
                {(this.state.status === Status.LoadingMarkers || this.state.status === Status.LoadingMap) && (
                    <View style={this.styles.loadingOverlay}>
                        <ActivityIndicator color={this.styles.loadingIndicator.color} size="large" />
                    </View>
                )}
            </View>
        );
    }

    private renderMarker({ key, props, coordinate, title, description, onPress }: Marker): JSX.Element {
        return (
            <MarkerView
                key={key}
                coordinate={coordinate}
                title={this.props.interactive ? title : ""}
                description={this.props.interactive ? description : ""}
                onPress={this.props.interactive ? () => onMarkerPress(onPress) : undefined}
                pinColor={props.color || this.styles.marker.color}
                opacity={this.styles.marker.opacity}
            >
                {props.icon && props.icon.value && (
                    <Icon
                        icon={props.icon.value}
                        color={props.color || this.styles.marker.color}
                        size={props.iconSize}
                    />
                )}
            </MarkerView>
        );
    }

    private onMapReady(): void {
        if (Platform.OS === "android") {
            this.updateCamera(false);
            this.setState({ status: this.props.interactive ? Status.MapReady : Status.CameraReady });
        }
        this.onRegionChangeComplete();
    }

    private onRegionChangeComplete(): void {
        if (Platform.OS === "android" && this.state.status === Status.MapReady) {
            this.setState({ status: Status.CameraReady });
        }

        if (Platform.OS === "ios") {
            switch (this.state.status) {
                case Status.LoadingMap:
                    this.setState({ status: Status.MapReady });
                    this.updateCamera(false);
                    break;
                case Status.MapReady:
                    this.setState({
                        status: this.props.provider === "default" ? Status.CameraAlmostReady : Status.CameraReady
                    });
                    break;
                case Status.CameraAlmostReady:
                    this.setState({ status: Status.CameraReady });
            }
        }
    }

    private async parseMarkers(): Promise<void> {
        const parsedMarkerSets = await Promise.all(
            this.props.markerSets.map(async (markerSet, msIndex) => {
                const parsedMarkerSet = await this.parseMarkerSet(markerSet, msIndex);
                return parsedMarkerSet;
            })
        );

        const emptyArray: ParsedMarker[] = [];
        // eslint-disable-next-line prefer-spread
        const parsedMarkers: ParsedMarker[] = emptyArray.concat.apply(emptyArray, parsedMarkerSets);

        if (parsedMarkers.length === 0 || parsedMarkers.some(marker => marker.coordinate == null)) {
            return;
        }

        this.setState(
            {
                // eslint-disable-next-line react/no-access-state-in-setstate
                status: this.state.status === Status.LoadingMarkers ? Status.LoadingMap : this.state.status,
                markers: parsedMarkers as Marker[]
            },
            () => {
                if (this.state.status === Status.CameraReady) {
                    this.updateCamera(true);
                }
            }
        );
    }

    private async parseMarkerSet(markerSet: MarkerSetProps, msIndex: number): Promise<ParsedMarker[]> {
        if (markerSet?.markerData?.status === ValueStatus.Available) {
            console.info("data ready, parsing marker set " + msIndex);
            const parsedMarkers = await Promise.all(
                markerSet?.markerData?.items
                    ? markerSet?.markerData?.items?.map(async (marker, index) => ({
                          key: `map_marker_${msIndex}_${index}`,
                          props: markerSet,
                          coordinate: await this.parseCoordinate(
                              markerSet.latitude ? markerSet.latitude(marker).value : undefined,
                              markerSet.longitude ? markerSet.longitude(marker).value : undefined,
                              markerSet.address ? markerSet.address(marker).value : undefined
                          ),
                          title: markerSet.title ? markerSet.title(marker).value : undefined,
                          description: markerSet.description ? markerSet.description(marker).value : undefined,
                          onPress: markerSet.onClick ? markerSet.onClick(marker) : undefined
                      }))
                    : []
            );
            if (parsedMarkers.some(marker => marker.coordinate == null)) {
                return [];
            }

            return parsedMarkers;
        } else {
            console.info("no data yet, can't parse marker set");
            return [];
        }
    }

    private async updateCamera(animate: boolean): Promise<void> {
        console.info("adjusting camera");

        if (!this.mapViewRef.current) {
            console.info("no mapViewRef, can't adjust camera");
            return;
        }

        if (this.props.fitToMarkers && this.state.markers!.length > 1) {
            console.info("fitting map to markers");
            this.mapViewRef.current.fitToElements(animate);
            return;
        }

        const camera = {
            center: await this.getCenter(),
            zoom: toZoomValue(this.props.defaultZoomLevel),
            altitude: toAltitude(this.props.defaultZoomLevel)
        };
        console.info("center of map will be: " + JSON.stringify(camera.center));

        if (animate) {
            this.mapViewRef.current.animateCamera(camera);
        } else {
            this.mapViewRef.current.setCamera(camera);
        }
    }

    private async getCenter(): Promise<LatLng> {
        const center =
            this.state.markers!.length === 1 && this.props.fitToMarkers
                ? this.state.markers![0].coordinate
                : await this.parseCoordinate(
                      this.props.centerLatitude?.status === ValueStatus.Available
                          ? this.props.centerLatitude?.value
                          : undefined,
                      this.props.centerLongitude?.status === ValueStatus.Available
                          ? this.props.centerLongitude?.value
                          : undefined,
                      this.props.centerAddress?.status === ValueStatus.Available
                          ? this.props.centerAddress?.value
                          : undefined
                  );

        return center || { latitude: 51.9066346, longitude: 4.4861703 };
    }

    private parseCoordinate(
        latitudeProp?: BigJs.Big,
        longitudeProp?: BigJs.Big,
        addressProp?: string
    ): Promise<LatLng | null> {
        if (latitudeProp && longitudeProp) {
            const latitude = Number(latitudeProp);
            const longitude = Number(longitudeProp);

            if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
                throw new Error(`Invalid coordinate provided: (${latitude}, ${longitude})`);
            }

            return Promise.resolve({ latitude, longitude });
        }

        if (addressProp) {
            return this.geocoder.geocode(addressProp);
        }

        return Promise.resolve(null);
    }
}

function isValidLatitude(latitude: number): boolean {
    return !isNaN(latitude) && latitude <= 90 && latitude >= -90;
}

function isValidLongitude(longitude: number): boolean {
    return !isNaN(longitude) && longitude <= 180 && longitude >= -180;
}

function onMarkerPress(action?: ActionValue): void {
    if (action && action.canExecute && !action.isExecuting) {
        action.execute();
    }
}

function toZoomValue(level: DefaultZoomLevelEnum): number {
    switch (level) {
        case "world":
            return 3;
        case "continent":
            return 5;
        case "country":
            return 7;
        case "city":
            return 10;
        case "town":
            return 12;
        case "streets":
            return 15;
        case "building":
            return 20;
    }
}

function toAltitude(level: DefaultZoomLevelEnum): number {
    switch (level) {
        case "world":
            return 16026161;
        case "continent":
            return 4006540;
        case "country":
            return 1001635;
        case "city":
            return 125204;
        case "town":
            return 31301;
        case "streets":
            return 3914;
        case "building":
            return 122;
    }
}
