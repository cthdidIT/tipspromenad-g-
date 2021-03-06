import { TabNavigator } from "react-navigation";

import QuestionList from "./QuestionList";
import AddQuestion from "./AddQuestion";
import DistanceView from "./DistanceView";
import ResultsView from "./ResultsView";

import { primaryColor } from "./config";

const Routes = TabNavigator(
  {
    Home: {
      screen: QuestionList
    },
    Distance: {
      screen: DistanceView
    },
    AddOwn: {
      screen: AddQuestion
    },
    Result: {
      screen: ResultsView
    }
  },
  {
    tabBarOptions: {
      activeTintColor: primaryColor,
      showIcon: true,
      indicatorStyle: {
        height: 0
      },
      style: {
        backgroundColor: "lightgray"
      }
    }
  }
);

export default Routes;
