import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {HydratedDocument} from "mongoose";

export type RandomSwapAmountDocument = HydratedDocument<RandomSwapAmount>;


@Schema({ timestamps: true })
export class RandomSwapAmount {

    @Prop({unique: true})
    incrementPositionKey: number;

    @Prop()
    swapAmountValue: number;

}

export const RandomSwapAmountSchema = SchemaFactory.createForClass(RandomSwapAmount);
