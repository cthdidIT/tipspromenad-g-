import React from "react";
import {
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  View,
  Alert
} from "react-native";
import { Constants, Location, Permissions, Audio } from "expo";
import { Motion, spring } from "react-motion";

import { distanceUpdateInterval } from "./config";

import _ from "lodash";

import TPText from "./TPText";
import Question from "./Question";

export default class DistanceView extends React.PureComponent {
  static navigationOptions = {
    tabBarLabel: "Sträcka",
    tabBarIcon: ({ tintColor }) =>
      <Image
        source={require("./res/distance.png")}
        style={[styles.icon, { tintColor: tintColor }]}
      />
  };

  state = {
    latitude: 0,
    longitude: 0,
    altitude: 0
  };

  playRandomSound = () => {
    const sound = _.sample(this.sounds);
    sound.playAsync().then(() => sound.setPositionAsync(0));
  };

  loadSounds = async () => {
    const sounds = [
      require("./res/plopp.mp3"),
      require("./res/nyfraga.mp3"),
      require("./res/fart.mp3")
    ].map(res => {
      let sound = new Audio.Sound();
      return sound.loadAsync(res).then(() => sound);
    });

    try {
      this.sounds = await Promise.all(sounds);
    } catch (error) {
      console.log("Could not load sound", error);
    }
  };

  async componentWillMount() {
    this.loadSounds();
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== "granted") {
      this.setState({
        errorMessage: "Permission to access location was denied"
      });
    }

    Location.watchPositionAsync(
      { enableHighAccuracy: true, distanceInterval: distanceUpdateInterval },
      this.positionUpdate
    );
  }

  REMOVEINPROD_increaseDistance = () => {
    const { setDistance, distance } = this.props.screenProps;

    setDistance(distance + 10);
  };

  measure = (lat1, lon1, lat2, lon2) => {
    // generally used geo measurement function
    var R = 6378.137; // Radius of earth in KM
    var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
    var dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d * 1000; // meters
  };

  positionUpdate = ({
    coords: { latitude, longitude, altitude },
    timestamp
  }) => {
    this.setState(state => {
      if (state.latitude === 0) {
        return {
          latitude,
          longitude,
          altitude
        };
      }
      const { distance } = this.props.screenProps;

      const latDiff = state.latitude - latitude;
      const lonDiff = state.longitude - longitude;
      const altDiff = state.altitude - altitude;

      const newDistance = this.measure(
        state.latitude,
        state.longitude,
        latitude,
        longitude
      );

      this.props.screenProps.setDistance(Math.round(distance + newDistance));
      return {
        latitude,
        longitude,
        altitude
      };
    });
  };

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.screenProps.unlockCount !== this.props.screenProps.unlockCount
    ) {
      this.playRandomSound();
      Alert.alert(
        "Ny fråga, va!",
        "Du har en ny fråga att svara på, änna",
        [
          {
            text: "Jajjamen vettu",
            onPress: () => this.props.navigation.navigate("Home")
          },
          {
            text: "Nahh, tarn senare",
            style: "cancel"
          }
        ],
        { cancelable: false }
      );
    }
  }

  render() {
    const { distance } = this.props.screenProps;

    return (
      <View style={styles.container}>
        <Motion defaultStyle={{ value: 0 }} style={{ value: spring(distance) }}>
          {({ value }) =>
            <TPText style={styles.distanceDisplay}>
              {Math.ceil(value)}m
            </TPText>}
        </Motion>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  icon: {
    width: 26,
    height: 26
  },
  distanceDisplay: {
    fontSize: 48
  }
});
