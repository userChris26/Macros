/*import PageTitle from '../components/PageTitle';
import LoggedInName from '../components/LoggedInName';
import CardUI from '../components/CardUI';

const CardPage = () =>
{
    return(
    <div>
        <PageTitle />
        <LoggedInName />
        <CardUI />
    </div>
    );
}

export default CardPage;*/
import PageTitle from '../components/PageTitle';
import LoggedInName from '../components/LoggedInName';
import CalorieTrackerUI from '../components/CardUI';

const CardPage = () => {
  return (
    <div className="calorie-tracker-page">
      <PageTitle />
      <LoggedInName />
      <CalorieTrackerUI />
    </div>
  );
};

export default CardPage;