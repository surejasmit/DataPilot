import argparse
from app.ml.registry import registry
from app.ml.training_data.dataset_classification_data import generate_classification_samples
from app.ml.training_data.schema_understanding_data import generate_schema_samples
from app.ml.training_data.insight_recommendation_data import generate_insight_samples, INSIGHT_CLASSES
from app.ml.training_data.command_understanding_data import generate_command_samples
from app.ml.training_data.chart_recommendation_data import generate_chart_samples

from app.ml.models.dataset_classifier import DatasetClassifierModel
from app.ml.models.schema_understander import SchemaUnderstanderModel
from app.ml.models.insight_recommender import InsightRecommenderModel
from app.ml.models.command_understander import CommandUnderstanderModel
from app.ml.models.chart_recommender import ChartRecommenderModel

def train_dataset_classifier():
    print("--- Training Model 1: Business Dataset Classification ---")
    texts, labels = generate_classification_samples(num_samples=600)
    model = DatasetClassifierModel()
    
    acc = model.evaluate(texts, labels)
    print(f"Validation Accuracy: {acc:.4f}")
    
    print("Fitting model on all data...")
    model.fit(texts, labels)
    registry.register_model("dataset_classifier", model)
    print("Model 1 training complete!\n")

def train_schema_understander():
    print("--- Training Model 2: Business Schema Understanding ---")
    texts, labels = generate_schema_samples(num_samples=500)
    model = SchemaUnderstanderModel()
    
    acc = model.evaluate(texts, labels)
    print(f"Validation Accuracy: {acc:.4f}")
    
    print("Fitting model on all data...")
    model.fit(texts, labels)
    registry.register_model("schema_understander", model)
    print("Model 2 training complete!\n")

def train_insight_recommender():
    print("--- Training Model 3: Insight Recommendation ---")
    texts, labels = generate_insight_samples(num_samples=500)
    model = InsightRecommenderModel(classes=INSIGHT_CLASSES)
    
    exact_match, hamming = model.evaluate(texts, labels)
    print(f"Exact Match Accuracy: {exact_match:.4f}, Hamming Accuracy: {hamming:.4f}")
    
    print("Fitting model on all data...")
    model.fit(texts, labels)
    registry.register_model("insight_recommender", model)
    print("Model 3 training complete!\n")

def train_command_understander():
    print("--- Training Model 4: Business Command Understanding ---")
    texts, labels = generate_command_samples(num_samples=500)
    model = CommandUnderstanderModel()
    
    acc = model.evaluate(texts, labels)
    print(f"Validation Accuracy: {acc:.4f}")
    
    print("Fitting model on all data...")
    model.fit(texts, labels)
    registry.register_model("command_understander", model)
    print("Model 4 training complete!\n")

def train_chart_recommender():
    print("--- Training Model 5: Chart Recommendation ---")
    texts, labels = generate_chart_samples(num_samples=600)
    model = ChartRecommenderModel()
    
    acc = model.evaluate(texts, labels)
    print(f"Validation Accuracy: {acc:.4f}")
    
    print("Fitting model on all data...")
    model.fit(texts, labels)
    registry.register_model("chart_recommender", model)
    print("Model 5 training complete!\n")

def main():
    parser = argparse.ArgumentParser(description="Train DataPilot AI models")
    parser.add_argument("--model", type=str, default="all", choices=["all", "classifier", "schema", "insight", "command", "chart"], help="Model to train")
    args = parser.parse_args()
    
    if args.model == "all":
        train_dataset_classifier()
        train_schema_understander()
        train_insight_recommender()
        train_command_understander()
        train_chart_recommender()
    elif args.model == "classifier":
        train_dataset_classifier()
    elif args.model == "schema":
        train_schema_understander()
    elif args.model == "insight":
        train_insight_recommender()
    elif args.model == "command":
        train_command_understander()
    elif args.model == "chart":
        train_chart_recommender()

if __name__ == "__main__":
    main()
